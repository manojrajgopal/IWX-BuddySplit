# Database Schema (PostgreSQL)

All tables use `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`. All timestamps are `TIMESTAMPTZ`.
Mutable rows carry `created_at`, `updated_at`, `created_by`, `updated_by`.
User-facing rows that should not be physically deleted carry `deleted_at TIMESTAMPTZ NULL`.

### Enums

- `workspace_status`: `active | paused | completed | archived`
- `workspace_kind`: `trip | group | roommates | couple | event | team | subscription | temporary | longterm | business | other`
- `member_role`: `owner | admin | editor | viewer`
- `invite_status`: `pending | accepted | declined | revoked | expired`
- `expense_split_mode`: `equal | exact | percentage | shares | adjustment | itemized`
- `settlement_status`: `pending | partial | completed | cancelled`
- `notification_kind`: `expense | settlement | invitation | workspace | system | reminder`
- `otp_purpose`: `register | login | reset_password | email_change`

### Core tables

```sql
users(
  id, email CITEXT UNIQUE NOT NULL, email_verified_at,
  password_hash TEXT, display_name, avatar_url,
  role TEXT DEFAULT 'user',     -- 'user' | 'admin'
  status TEXT DEFAULT 'active',
  last_login_at, created_at, updated_at, deleted_at
)

sessions(
  id, user_id FK→users, refresh_token_hash, user_agent, ip,
  expires_at, revoked_at, created_at
)

otp_verifications(
  id, email CITEXT, purpose otp_purpose, code_hash,
  attempts INT DEFAULT 0, max_attempts INT DEFAULT 5,
  expires_at, consumed_at, created_at
)

invitations(
  id, workspace_id FK→workspaces, email CITEXT,
  invited_by FK→users, role member_role,
  token_hash, status invite_status, expires_at,
  accepted_at, declined_at, created_at
)

workspaces(
  id, kind workspace_kind, name, slug UNIQUE, description,
  base_currency CHAR(3) NOT NULL,
  status workspace_status DEFAULT 'active',
  epoch INT NOT NULL DEFAULT 1,
  cover_color, owner_id FK→users,
  created_at, updated_at, deleted_at
)

workspace_members(
  id, workspace_id FK, user_id FK,
  role member_role DEFAULT 'editor',
  joined_at, left_at,
  UNIQUE(workspace_id, user_id)
)

expenses(
  id, workspace_id FK, epoch INT NOT NULL,
  payer_member_id FK→workspace_members,
  description, category, occurred_at,
  total_minor BIGINT NOT NULL CHECK (total_minor >= 0),
  currency CHAR(3) NOT NULL,
  split_mode expense_split_mode NOT NULL,
  split_config JSONB NOT NULL,           -- raw input for re-computation/audit
  notes,
  created_by, updated_by, created_at, updated_at, deleted_at
)

expense_splits(
  id, expense_id FK,
  member_id FK→workspace_members,
  share_minor BIGINT NOT NULL,           -- exact, sums to expense.total_minor
  meta JSONB,
  UNIQUE(expense_id, member_id)
)

expense_history(
  id, expense_id FK, version INT NOT NULL,
  snapshot JSONB NOT NULL,               -- previous state
  changed_by FK→users, changed_at
)

settlements(
  id, workspace_id FK, epoch INT NOT NULL,
  from_member_id FK, to_member_id FK,
  amount_minor BIGINT NOT NULL,
  currency CHAR(3) NOT NULL,
  status settlement_status DEFAULT 'pending',
  suggested_at, completed_at, cancelled_at,
  created_by, created_at, updated_at
)

settlement_transactions(
  id, settlement_id FK,
  amount_minor BIGINT NOT NULL,          -- actual paid amount (supports partial)
  method TEXT, reference TEXT, note TEXT,
  recorded_by FK→users, recorded_at
)

workspace_snapshots(
  id, workspace_id FK, epoch INT NOT NULL,
  snapshot_kind TEXT,                    -- 'completion' | 'manual' | 'reopen'
  payload JSONB NOT NULL,
  created_at
)

attachments(
  id, workspace_id FK, expense_id FK NULL,
  filename, content_type, byte_size,
  storage_key TEXT,                       -- local FS path or S3 key (pluggable)
  uploaded_by, created_at
)

notifications(
  id, user_id FK, workspace_id FK NULL,
  kind notification_kind, title, body, payload JSONB,
  read_at, created_at
)

email_templates(
  id, key TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL, html TEXT NOT NULL, text TEXT,
  variables JSONB, updated_at
)

outbox(
  id, kind TEXT NOT NULL,                -- 'email' | 'realtime' | 'revalidate'
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending',         -- pending|sent|failed
  attempts INT DEFAULT 0, last_error TEXT,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at, created_at
)

site_settings(
  key TEXT PRIMARY KEY, value JSONB NOT NULL, group_name TEXT,
  is_public BOOLEAN DEFAULT true, updated_at, updated_by
)

navigation_items(
  id, location TEXT NOT NULL,             -- 'primary'|'footer'|'admin'|'user'
  parent_id NULL, label TEXT, href TEXT,
  icon TEXT, sort_order INT, visible BOOLEAN, requires_role TEXT
)

branding_assets(
  id, key TEXT UNIQUE,                   -- 'logo'|'favicon'|'og_image'
  url TEXT, mime TEXT, width INT, height INT, updated_at
)

page_sections(
  id, page TEXT, slot TEXT, sort_order INT,
  kind TEXT,                              -- 'hero'|'cards'|'cta'|'text'|...
  content JSONB, visible BOOLEAN, updated_at
)

audit_logs(
  id, actor_user_id FK NULL, workspace_id FK NULL,
  action TEXT NOT NULL, entity TEXT, entity_id UUID,
  diff JSONB, ip, ua, created_at
)

activity_logs(
  id, workspace_id FK, actor_user_id FK NULL,
  action TEXT, payload JSONB, created_at
)
```

### Indexes

```sql
CREATE INDEX ON expenses(workspace_id, occurred_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX ON expense_splits(member_id);
CREATE INDEX ON settlements(workspace_id, status);
CREATE INDEX ON notifications(user_id, read_at NULLS FIRST, id DESC);
CREATE INDEX ON outbox(status, available_at) WHERE status = 'pending';
CREATE INDEX ON invitations(email, status);
CREATE UNIQUE INDEX ON workspace_members(workspace_id, user_id);
CREATE UNIQUE INDEX ON site_settings(key);
```

### Invariants (enforced in service layer & tests)

- `Σ expense_splits.share_minor = expenses.total_minor` per expense.
- `Σ (paid − owed)` across members of a workspace = 0 per epoch.
- Settlement `amount_minor > 0`.
- Workspace status transitions: `active ↔ paused`, `active|paused → completed`, `completed → active` (reopen, increments `epoch`).
