# IWX-BuddySplit

A production-grade, real-time expense sharing and settlement platform.

**Stack:** Next.js (frontend) · NestJS (backend) · PostgreSQL · SMTP (nodemailer) · Socket.IO.
**Hard constraints:** no Redis, no paid SaaS, no visible spinners, all CMS content from DB.

## Monorepo layout

```
IWX-BuddySplit/
├── docs/                 architecture, schema, money rules, runbooks
├── backend/              NestJS API + realtime gateway + workers
├── frontend/             Next.js 14 (App Router) – dynamic CMS-driven UI
└── infra/                docker-compose for local Postgres + smtp
```

## Quick start

1. `cp backend/.env.example backend/.env` and edit DB + SMTP creds.
2. `cp frontend/.env.example frontend/.env.local`.
3. `docker compose -f infra/docker-compose.yml up -d` (Postgres + MailHog).
4. `cd backend && npm i && npm run migration:run && npm run seed && npm run start:dev`.
5. `cd frontend && npm i && npm run dev`.

Open http://localhost:3000.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full plan and deliverables 1–10.

## Quick Start
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
npm install
npm run infra:up                    # Postgres + MailHog
npm --workspace backend run migration:run
npm --workspace backend run seed
npm run dev:backend                 # :4000
npm run dev:frontend                # :3000
```