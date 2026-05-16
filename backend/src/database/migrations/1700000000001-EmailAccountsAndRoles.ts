import { MigrationInterface, QueryRunner } from 'typeorm';

export class EmailAccountsAndRoles1700000000001 implements MigrationInterface {
  name = 'EmailAccountsAndRoles1700000000001';

  public async up(qr: QueryRunner): Promise<void> {
    // ── email_accounts ───────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE email_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        provider TEXT NOT NULL,
        from_address TEXT NOT NULL,
        config_encrypted TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_default BOOLEAN NOT NULL DEFAULT false,
        last_used_at TIMESTAMPTZ,
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await qr.query(`CREATE INDEX email_accounts_is_active_idx  ON email_accounts(is_active)`);
    await qr.query(`CREATE INDEX email_accounts_is_default_idx ON email_accounts(is_default)`);
    // At most one default account.
    await qr.query(`CREATE UNIQUE INDEX email_accounts_one_default_uk
                    ON email_accounts((is_default)) WHERE is_default = true`);

    // ── roles ────────────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        is_system BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await qr.query(`
      CREATE TABLE role_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        resource TEXT NOT NULL,
        action TEXT NOT NULL,
        CONSTRAINT role_permissions_role_resource_action_uk UNIQUE (role_id, resource, action)
      )
    `);
    await qr.query(`CREATE INDEX role_permissions_role_idx ON role_permissions(role_id)`);

    // Seed built-in system roles so the UI has something to start with.
    await qr.query(`INSERT INTO roles (name, description, is_system) VALUES
      ('admin', 'Full platform access', true),
      ('user',  'Default end-user role', true)`);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS role_permissions CASCADE`);
    await qr.query(`DROP TABLE IF EXISTS roles CASCADE`);
    await qr.query(`DROP TABLE IF EXISTS email_accounts CASCADE`);
  }
}
