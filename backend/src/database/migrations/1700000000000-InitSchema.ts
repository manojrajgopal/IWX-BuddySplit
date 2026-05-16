import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await qr.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);

    // ── Enums ────────────────────────────────────────────────────────────
    await qr.query(`CREATE TYPE workspace_status AS ENUM ('active','paused','completed','archived')`);
    await qr.query(`CREATE TYPE workspace_kind   AS ENUM ('trip','group','roommates','couple','event','team','subscription','temporary','longterm','business','other')`);
    await qr.query(`CREATE TYPE member_role      AS ENUM ('owner','admin','editor','viewer')`);
    await qr.query(`CREATE TYPE invite_status    AS ENUM ('pending','accepted','declined','revoked','expired')`);
    await qr.query(`CREATE TYPE expense_split_mode AS ENUM ('equal','exact','percentage','shares','adjustment','itemized')`);
    await qr.query(`CREATE TYPE settlement_status AS ENUM ('pending','partial','completed','cancelled')`);
    await qr.query(`CREATE TYPE notification_kind AS ENUM ('expense','settlement','invitation','workspace','system','reminder')`);
    await qr.query(`CREATE TYPE otp_purpose      AS ENUM ('register','login','reset_password','email_change')`);

    // ── users ────────────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email CITEXT UNIQUE NOT NULL,
        email_verified_at TIMESTAMPTZ,
        password_hash TEXT,
        display_name TEXT NOT NULL,
        avatar_url TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        status TEXT NOT NULL DEFAULT 'active',
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ
      )
    `);

    // ── sessions ─────────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_token_hash TEXT NOT NULL,
        user_agent TEXT,
        ip TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await qr.query(`CREATE INDEX sessions_user_idx ON sessions(user_id)`);

    // ── otp_verifications ────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE otp_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email CITEXT NOT NULL,
        purpose otp_purpose NOT NULL,
        code_hash TEXT NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        max_attempts INT NOT NULL DEFAULT 5,
        expires_at TIMESTAMPTZ NOT NULL,
        consumed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await qr.query(`CREATE INDEX otp_email_purpose_idx ON otp_verifications(email, purpose)`);

    // ── workspaces ───────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE workspaces (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        kind workspace_kind NOT NULL DEFAULT 'group',
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        base_currency CHAR(3) NOT NULL,
        status workspace_status NOT NULL DEFAULT 'active',
        epoch INT NOT NULL DEFAULT 1,
        cover_color TEXT,
        owner_id UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ
      )
    `);

    await qr.query(`
      CREATE TABLE workspace_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role member_role NOT NULL DEFAULT 'editor',
        joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        left_at TIMESTAMPTZ,
        UNIQUE (workspace_id, user_id)
      )
    `);
    await qr.query(`CREATE INDEX wm_workspace_idx ON workspace_members(workspace_id)`);

    // ── invitations ──────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        email CITEXT NOT NULL,
        invited_by UUID NOT NULL REFERENCES users(id),
        role member_role NOT NULL DEFAULT 'editor',
        token_hash TEXT NOT NULL,
        status invite_status NOT NULL DEFAULT 'pending',
        expires_at TIMESTAMPTZ NOT NULL,
        accepted_at TIMESTAMPTZ,
        declined_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await qr.query(`CREATE INDEX invitations_email_status_idx ON invitations(email, status)`);
    await qr.query(`CREATE INDEX invitations_workspace_idx    ON invitations(workspace_id)`);

    // ── expenses ─────────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        epoch INT NOT NULL,
        payer_member_id UUID NOT NULL REFERENCES workspace_members(id),
        description TEXT NOT NULL,
        category TEXT,
        occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        total_minor BIGINT NOT NULL CHECK (total_minor >= 0),
        currency CHAR(3) NOT NULL,
        split_mode expense_split_mode NOT NULL,
        split_config JSONB NOT NULL,
        notes TEXT,
        created_by UUID NOT NULL REFERENCES users(id),
        updated_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ
      )
    `);
    await qr.query(`CREATE INDEX expenses_workspace_occurred_idx ON expenses(workspace_id, occurred_at DESC) WHERE deleted_at IS NULL`);

    await qr.query(`
      CREATE TABLE expense_splits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES workspace_members(id),
        share_minor BIGINT NOT NULL,
        meta JSONB,
        UNIQUE (expense_id, member_id)
      )
    `);
    await qr.query(`CREATE INDEX expense_splits_member_idx ON expense_splits(member_id)`);

    await qr.query(`
      CREATE TABLE expense_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
        version INT NOT NULL,
        snapshot JSONB NOT NULL,
        changed_by UUID REFERENCES users(id),
        changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── settlements ──────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE settlements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        epoch INT NOT NULL,
        from_member_id UUID NOT NULL REFERENCES workspace_members(id),
        to_member_id   UUID NOT NULL REFERENCES workspace_members(id),
        amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
        currency CHAR(3) NOT NULL,
        status settlement_status NOT NULL DEFAULT 'pending',
        suggested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        completed_at TIMESTAMPTZ,
        cancelled_at TIMESTAMPTZ,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await qr.query(`CREATE INDEX settlements_workspace_status_idx ON settlements(workspace_id, status)`);

    await qr.query(`
      CREATE TABLE settlement_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
        amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
        method TEXT,
        reference TEXT,
        note TEXT,
        recorded_by UUID REFERENCES users(id),
        recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await qr.query(`
      CREATE TABLE workspace_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        epoch INT NOT NULL,
        snapshot_kind TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── attachments ──────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        content_type TEXT,
        byte_size BIGINT,
        storage_key TEXT NOT NULL,
        uploaded_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── notifications ────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
        kind notification_kind NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        payload JSONB,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await qr.query(`CREATE INDEX notifications_feed_idx ON notifications(user_id, read_at NULLS FIRST, id DESC)`);

    // ── email_templates ──────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE email_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT UNIQUE NOT NULL,
        subject TEXT NOT NULL,
        html TEXT NOT NULL,
        text TEXT,
        variables JSONB,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── outbox ───────────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE outbox (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        kind TEXT NOT NULL,
        payload JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INT NOT NULL DEFAULT 0,
        last_error TEXT,
        available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await qr.query(`CREATE INDEX outbox_pending_idx ON outbox(status, available_at) WHERE status = 'pending'`);

    // ── CMS ──────────────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE site_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        group_name TEXT,
        is_public BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_by UUID REFERENCES users(id)
      )
    `);
    await qr.query(`
      CREATE TABLE navigation_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        location TEXT NOT NULL,
        parent_id UUID REFERENCES navigation_items(id) ON DELETE CASCADE,
        label TEXT NOT NULL,
        href TEXT NOT NULL,
        icon TEXT,
        sort_order INT NOT NULL DEFAULT 0,
        visible BOOLEAN NOT NULL DEFAULT true,
        requires_role TEXT
      )
    `);
    await qr.query(`CREATE INDEX nav_location_sort_idx ON navigation_items(location, sort_order)`);

    await qr.query(`
      CREATE TABLE branding_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT UNIQUE NOT NULL,
        url TEXT NOT NULL,
        mime TEXT,
        width INT,
        height INT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await qr.query(`
      CREATE TABLE page_sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        page TEXT NOT NULL,
        slot TEXT NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        kind TEXT NOT NULL,
        content JSONB NOT NULL,
        visible BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await qr.query(`CREATE INDEX page_sections_lookup_idx ON page_sections(page, slot, sort_order)`);

    // ── logs ─────────────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE audit_logs (
        id BIGSERIAL PRIMARY KEY,
        actor_user_id UUID REFERENCES users(id),
        workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        entity TEXT,
        entity_id UUID,
        diff JSONB,
        ip TEXT,
        ua TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await qr.query(`
      CREATE TABLE activity_logs (
        id BIGSERIAL PRIMARY KEY,
        workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
        actor_user_id UUID REFERENCES users(id),
        action TEXT NOT NULL,
        payload JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await qr.query(`CREATE INDEX activity_workspace_created_idx ON activity_logs(workspace_id, created_at DESC)`);
  }

  public async down(qr: QueryRunner): Promise<void> {
    const drop = (t: string) => qr.query(`DROP TABLE IF EXISTS ${t} CASCADE`);
    const tables = [
      'activity_logs','audit_logs','page_sections','branding_assets','navigation_items',
      'site_settings','outbox','email_templates','notifications','attachments',
      'workspace_snapshots','settlement_transactions','settlements',
      'expense_history','expense_splits','expenses',
      'invitations','workspace_members','workspaces',
      'otp_verifications','sessions','users',
    ];
    for (const t of tables) await drop(t);
    const types = ['otp_purpose','notification_kind','settlement_status','expense_split_mode',
                   'invite_status','member_role','workspace_kind','workspace_status'];
    for (const t of types) await qr.query(`DROP TYPE IF EXISTS ${t}`);
  }
}
