# IWX BuddySplit — Architecture & Plan

This document covers the ten deliverables required by the brief.

---

## 1. Architecture plan

**High level**

```
┌──────────────────────┐        HTTPS / WSS         ┌────────────────────────┐
│  Next.js 14 (App     │  ───────────────────────▶  │  NestJS API + Gateway  │
│  Router, RSC, SSR)   │                            │  (HTTP + Socket.IO)    │
└─────────┬────────────┘                            └────────────┬───────────┘
          │ server actions / fetch                                │
          │                                                       │
          ▼                                                       ▼
┌──────────────────────┐                            ┌────────────────────────┐
│ Edge fetch + in-     │                            │ PostgreSQL  (single    │
│ process LRU cache    │                            │ source of truth +      │
│ + ETag revalidation  │                            │ LISTEN/NOTIFY bus)     │
└──────────────────────┘                            └────────────┬───────────┘
                                                                 │ SMTP
                                                                 ▼
                                                       Nodemailer → MTA
```

**Key decisions**

| Concern | Decision | Why |
| --- | --- | --- |
| State of truth | PostgreSQL only | Constraint; transactional money |
| Cross-instance bus | Postgres `LISTEN/NOTIFY` | No Redis allowed |
| Realtime transport | Socket.IO with sticky rooms keyed by `workspace:{id}` | Built-in fallback, free, MIT |
| Cache | In-process LRU (`lru-cache`) keyed by entity, invalidated via NOTIFY | No Redis |
| Money | `bigint` minor units, central `Money` value object, banker-friendly rounding | Float is forbidden in finance |
| Migrations | TypeORM migrations (forward-only, hand-written) | Auditable, reviewable |
| Email | `nodemailer` over SMTP from `.env` | No vendor APIs |
| Auth | Argon2id password + JWT access + opaque refresh (DB-tracked sessions) | No external IdP |
| OTP | DB-stored, hashed (HMAC-SHA256), TTL, max attempts | Self-contained |
| CMS | All branding/menus/labels/copy in `site_settings` + `navigation_items` + `branding_assets` | Future-proof |
| Background work | Postgres-backed work queue (`outbox` table + scheduler) | No Redis/BullMQ |

**Performance strategy → "feels instant"**

- Next.js Server Components for first paint; route-level prefetching via `<Link prefetch>`.
- Per-request data loaders batched per render; cached at the edge with stable cache tags.
- Optimistic updates for expense create/edit (with rollback on server reject).
- Background warmers: every workspace mutation pushes a `revalidate:{tag}` over `NOTIFY` → all Next.js servers `revalidateTag`.
- WebSocket pushes the *minimal patch* (delta), never the whole list.
- No spinners: skeletons only as a last resort, capped at 80 ms appearance delay.

---

## 2. Database schema design

Full DDL: [`docs/SCHEMA.md`](SCHEMA.md). Entity overview:

```
users ─┬─< sessions
       ├─< otp_verifications
       ├─< workspace_members >── workspaces ─┬─< invitations
       │                                     ├─< expenses ──< expense_splits
       │                                     ├─< settlements ──< settlement_transactions
       │                                     ├─< attachments
       │                                     ├─< activity_logs
       │                                     └─< audit_logs
       └─< notifications
site_settings (singleton-per-key)
navigation_items / branding_assets / email_templates / page_sections
outbox (background jobs)
```

All money columns are `BIGINT NOT NULL` (minor units) + `currency CHAR(3)`.
Soft-delete via `deleted_at TIMESTAMPTZ NULL` on user-facing rows. Audit columns `created_at`, `updated_at`, `created_by`, `updated_by` on mutable rows.

---

## 3. Folder structure

```
backend/
  src/
    main.ts
    app.module.ts
    config/                env loader, validation, typed config
    core/
      database/            DataSource, NOTIFY listener, unit-of-work
      cache/               in-process LRU + invalidation
      mail/                SMTP transport, template renderer
      realtime/            Socket.IO gateway, rooms, dispatcher
      money/               Money value object, rounding, currency
      crypto/              argon2, HMAC, token gen
      logger/              pino-based
    common/
      guards/              JwtAuthGuard, RolesGuard, WorkspaceMemberGuard
      pipes/               ZodValidationPipe
      interceptors/        TransactionInterceptor, ResponseEnvelope
      filters/             AllExceptionsFilter
      decorators/          @CurrentUser, @Workspace
      dto/                 shared DTOs (pagination, ids)
    modules/
      auth/                controllers, services, dto, strategies
      users/
      otp/
      invitations/
      workspaces/
      members/
      expenses/
        engines/           SplitEngine
      settlements/
        engines/           SettlementEngine (simplification)
      notifications/
      email/               templates + dispatcher
      settings/            site CMS
      branding/
      navigation/
      uploads/
      audit/
      analytics/
      admin/
    database/
      migrations/
      seeds/

frontend/
  src/
    app/                   App Router routes
      (marketing)/
      (auth)/login, /register, /verify, /forgot-password
      (app)/dashboard, /workspaces, /workspaces/[id]/..., /admin/...
      api/                 route handlers (proxy + revalidation hooks)
    components/
      ui/                  buttons, card, modal, drawer, table, toast, …
      layout/              Shell, Sidebar, Topbar, Footer
      cms/                 DynamicMenu, BrandLogo, DynamicSection
    features/
      auth/                forms, hooks
      workspaces/
      expenses/
      settlements/
      invitations/
      notifications/
      settings/
      admin/
    lib/
      api/                 typed fetcher, server-action helpers
      cache/               cache tags + revalidation helpers
      realtime/            socket.io client + react bindings
      money/               Money formatting (mirrors backend)
      auth/                session, cookies
    hooks/
    stores/                zustand stores (UI only — never source-of-truth money)
    styles/                tokens.css, globals.css, components.css
    theme/                 ThemeProvider (dark by default)
    types/
    constants/
    forms/                 react-hook-form + zod schemas
```

---

## 4. Module breakdown

| Module | Responsibility | Key files |
| --- | --- | --- |
| `auth` | login/refresh/logout, password hashing, session table | `auth.service.ts`, `jwt.strategy.ts` |
| `otp` | issue + verify HMAC-hashed OTP, attempt throttling | `otp.service.ts` |
| `users` | profile, devices | `users.service.ts` |
| `invitations` | tokenized invite, accept/decline, expiry | `invitations.service.ts` |
| `workspaces` | CRUD, status (active/paused/completed/archived), reopen | `workspaces.service.ts` |
| `members` | roles, join/leave, role enforcement | `members.service.ts` |
| `expenses` | add/edit/soft-delete, split orchestration, edit history | `expenses.service.ts`, `engines/split.engine.ts` |
| `settlements` | balance compute, simplification, partial settle, ledger | `settlements.service.ts`, `engines/settlement.engine.ts` |
| `email` | template render + SMTP send + outbox-backed delivery | `email.service.ts`, `dispatcher.ts` |
| `notifications` | DB feed + push via realtime | `notifications.service.ts` |
| `realtime` | Socket.IO gateway, room auth | `realtime.gateway.ts` |
| `settings` | dynamic CMS settings | `settings.service.ts` |
| `branding` | logo, favicon | `branding.service.ts` |
| `navigation` | dynamic menu items | `navigation.service.ts` |
| `admin` | management endpoints (RBAC: `admin`) | `admin.controller.ts` |
| `analytics` | rollups, reports | `analytics.service.ts` |
| `audit` | append-only audit log writer | `audit.service.ts` |

---

## 5. Feature roadmap

**Phase 1 — Foundations (this delivery)**
Auth+OTP, workspaces, members, expenses with all split modes, settlements with simplification + partial settle, email engine, realtime, dynamic CMS shell, admin shell.

**Phase 2**
Receipts (uploads), activity timeline UI, advanced filters, exports (CSV/PDF), per-user analytics.

**Phase 3**
Recurring expenses, budgets, multi-currency conversion (FX cached daily from a free source — pluggable provider interface), shared subscriptions module.

**Phase 4**
Tax handling, invoice exports, team billing, payment gateway adapter (pluggable), OCR via local model worker, AI insights.

Extension points are explicit in `core/*` interfaces so none of the above requires touching the settlement engine.

---

## 6. Calculation logic plan

See [`docs/MONEY.md`](MONEY.md) for the full spec. Highlights:

- All monetary amounts are `bigint` **minor units** end-to-end. The DB column type is `BIGINT NOT NULL` with `currency CHAR(3) NOT NULL`.
- A `Money(amount: bigint, currency: string)` value object enforces arithmetic + currency safety.
- Rounding is **largest-remainder** (Hamilton method): split `total` into `n` shares, give the floor to each, then distribute the remaining minor units to the participants with the largest fractional remainders. This guarantees:
  - the sum of shares equals the total to the minor unit,
  - the maximum share differs from the minimum by at most 1 minor unit,
  - the result is deterministic given a stable participant order.
- **Split modes:** `EQUAL`, `EXACT`, `PERCENTAGE` (bp, sums to 10000), `SHARES` (integer weights), `ADJUSTMENT` (equal + per-person delta), `ITEMIZED` (per-line). All produce a list of `(memberId, shareMinor)` that sum exactly to the expense total.
- **Balances:** per-member `paid_minor − owed_minor = net_minor`. Sum of all nets in a workspace is always 0 (invariant enforced by test).
- **Settlement simplification:** greedy creditor-debtor matching. Given nets sorted ascending (debtors negative, creditors positive), repeatedly match the largest creditor with the largest debtor; the transfer amount is `min(creditor, |debtor|)`. Stops when all nets are 0. Produces ≤ `n − 1` transfers (optimal for this NP-hard problem in practice; matches every popular splitter app).
- **Partial settlement:** when a payer pays less than the suggested amount, the residue is re-inserted into the net computation; the engine recomputes simplification on the *remaining* nets. Original suggested chain is never mutated, only the ledger is appended.
- **Reopen flow:** completing a workspace freezes a `settlement_snapshot` (immutable). Reopening creates a new "epoch" and continues with a fresh ledger; historical snapshot is preserved.
- All write paths run inside a **`SERIALIZABLE`** TypeORM transaction; balance recomputation is idempotent and re-runnable.

---

## 7. Email / event plan

Events are abstracted via `EmailDispatcher.send(event, payload, recipients)`. Templates live in `email_templates` table (subject + MJML/HTML + text); the engine renders with Handlebars-style placeholders and falls back to filesystem template if DB row missing.

| Event key | Trigger | Recipients |
| --- | --- | --- |
| `auth.otp.requested` | OTP issued | requesting email |
| `auth.password.reset` | Reset requested | account email |
| `invite.sent` | Workspace invite created | invitee email |
| `invite.accepted` | Invitee joined | inviter |
| `workspace.member.joined` | Member added | all members |
| `workspace.status.paused` | Status changed → paused | all members |
| `workspace.status.completed` | Status changed → completed | all members |
| `workspace.status.reopened` | Status changed → active | all members |
| `expense.created` | New expense | participants (digest-eligible) |
| `settlement.reminder` | Scheduled reminder | debtors |
| `settlement.completed` | Settlement marked done | both parties |

All emails are queued into the `outbox` table inside the same DB transaction as the triggering write → guaranteed at-least-once delivery. A scheduler polls `outbox` every 2 s and ships through SMTP; failed sends back off exponentially.

---

## 8. Realtime event plan

Transport: Socket.IO with JWT handshake. Server rooms:

- `user:{userId}` — personal notifications, invitation status, balance updates.
- `workspace:{workspaceId}` — expense/settlement/member/status changes (members only).
- `admin:global` — admin dashboard counters.

| Event | Payload | Source |
| --- | --- | --- |
| `notification.new` | `{id, type, title, body, createdAt}` | notifications service |
| `workspace.member.changed` | `{workspaceId, memberId, action}` | members service |
| `workspace.status.changed` | `{workspaceId, status}` | workspaces service |
| `expense.created` / `expense.updated` / `expense.deleted` | `{workspaceId, expense}` | expenses service |
| `balance.changed` | `{workspaceId, balances}` (delta) | settlements service |
| `settlement.suggested` | `{workspaceId, transfers}` | settlements service |
| `settlement.recorded` | `{workspaceId, transactionId}` | settlements service |
| `invite.status.changed` | `{invitationId, status}` | invitations service |
| `cms.changed` | `{key}` | admin/settings service → triggers Next.js `revalidateTag` |

Cross-instance: every emit also `pg_notify('rt', json)`; other API instances forward to their connected sockets. No Redis.

---

## 9. Performance strategy

- **Server-first rendering** for every authenticated page; data fetched in RSC with cache tags `ws:{id}`, `expense:{id}`, etc.
- **Cache invalidation** via the same `pg_notify('rt', …)` bus → Next.js hits `/api/revalidate` (signed) → `revalidateTag`.
- **Prefetch on hover** for workspace links via App Router default behavior.
- **Optimistic UI** for: add expense, edit expense, mark settlement done.
- **Connection pooling** via `pg-pool`; max 20 per instance.
- **Indexes** on every FK + `(workspace_id, created_at DESC)` on expenses, `(workspace_id, status)` on settlements, `(user_id, read_at)` on notifications.
- **Pagination** only on activity log, audit log, notifications feed (cursor-based by `id DESC`).
- **No N+1** — all list endpoints use `LEFT JOIN LATERAL` or explicit `IN (...)` batchers.
- **Skeletons** only on the very first cold visit of large lists (default disabled; opt-in per route).

---

## 10. Implementation order

1. Repo + tooling + env + docker-compose.
2. DB schema + first migration + seeds.
3. Money + SettlementEngine + SplitEngine + unit tests.
4. Core (config, db, cache, mail, realtime, crypto, logger).
5. Auth + OTP + invitations.
6. Workspaces + members.
7. Expenses (with engines wired in).
8. Settlements (with engines wired in).
9. Email templates + notifications + outbox worker.
10. CMS (settings, branding, navigation).
11. Admin endpoints.
12. Frontend shell + theme + dynamic CMS layout.
13. Auth pages (login / register / OTP / forgot).
14. Dashboard + workspaces list/detail.
15. Expense create/edit, settlement suggestions, partial settle.
16. Admin UI.
17. Polish, accessibility, responsive QA.
