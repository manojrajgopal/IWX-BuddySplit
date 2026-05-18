import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
loadEnv({ path: resolve(__dirname, '..', '..', '.env') });
loadEnv({ path: resolve(__dirname, '..', '..', '.env.local'), override: true });

import { AppDataSource } from '../data-source';
import { UserEntity } from '@/modules/users/entities/user.entity';
import { SiteSettingEntity } from '@/modules/settings/entities/site-setting.entity';
import { NavigationItemEntity } from '@/modules/navigation/entities/navigation-item.entity';
import { BrandingAssetEntity } from '@/modules/branding/entities/branding-asset.entity';
import { EmailTemplateEntity } from '@/modules/email/entities/email-template.entity';
import { builtInTemplates } from '@/core/mail/templates';
import * as argon2 from 'argon2';

async function main(): Promise<void> {
  await AppDataSource.initialize();
  const users = AppDataSource.getRepository(UserEntity);
  const settings = AppDataSource.getRepository(SiteSettingEntity);
  const nav = AppDataSource.getRepository(NavigationItemEntity);
  const brand = AppDataSource.getRepository(BrandingAssetEntity);
  const templates = AppDataSource.getRepository(EmailTemplateEntity);

  // ── admin user ──────────────────────────────────────────────────────────
  const adminEmail = 'admin@buddysplit.local';
  const passwordHash = await argon2.hash('admin123!' + (process.env.PASSWORD_PEPPER ?? ''), { type: argon2.argon2id });
  let admin = await users.findOne({ where: { email: adminEmail } });
  if (!admin) {
    admin = await users.save(users.create({
      email: adminEmail,
      displayName: 'Admin',
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
    }));
    // eslint-disable-next-line no-console
    console.log(`Seeded admin: ${adminEmail} / admin123!`);
  } else {
    await users.update({ id: admin.id }, { passwordHash });
    // eslint-disable-next-line no-console
    console.log(`Updated admin password hash for: ${adminEmail}`);
  }

  // ── site settings (public) ──────────────────────────────────────────────
  const publicSettings: Array<[string, unknown]> = [
    ['app.name', 'IWX BuddySplit'],
    ['app.tagline', 'Track every rupee. Settle every chain.'],
    ['app.description', 'A premium expense-sharing and real-time settlement platform.'],
    ['company.name', 'InfiniteWaveX'],
    ['company.contact_email', 'hello@infinitewavex.com'],
    ['footer.text', `© ${new Date().getFullYear()} InfiniteWaveX. All rights reserved.`],
    ['social.twitter', ''],
    ['social.github', ''],
    ['social.linkedin', ''],
    ['theme.default', 'dark'],
    ['cta.primary.label', 'Start splitting'],
    ['cta.primary.href', '/register'],
    ['hero.title', 'Money clarity for groups.'],
    ['hero.subtitle', 'Real-time expense tracking, exact splits, and the simplest settlement chain you have ever seen.'],
    ['feature.cards', [
      { title: 'Real-time sync', body: 'Every member sees every change the moment it happens.' },
      { title: 'Exact splits', body: 'Integer-money arithmetic — no rounding mistakes, ever.' },
      { title: 'Simplest settlements', body: 'We collapse owe-chains into the fewest possible transfers.' },
    ]],
  ];
  for (const [key, value] of publicSettings) {
    await settings.upsert(
      { key, value, isPublic: true } as any,
      ['key'],
    );
  }

  // ── navigation ──────────────────────────────────────────────────────────
  const navItems: Array<Partial<NavigationItemEntity>> = [
    { location: 'primary', label: 'Dashboard',  href: '/dashboard',  sortOrder: 10, visible: true },
    { location: 'primary', label: 'Workspaces', href: '/workspaces', sortOrder: 20, visible: true },
    { location: 'primary', label: 'Settings',   href: '/settings',   sortOrder: 90, visible: true },
    { location: 'admin',   label: 'Admin',      href: '/admin',      sortOrder: 10, visible: true, requiresRole: 'admin' },
    { location: 'admin',   label: 'Email accounts', href: '/admin/email-accounts', sortOrder: 20, visible: true, requiresRole: 'admin' },
    { location: 'admin',   label: 'Roles & access',  href: '/admin/roles',          sortOrder: 30, visible: true, requiresRole: 'admin' },
    { location: 'footer',  label: 'Privacy',    href: '/privacy',    sortOrder: 10, visible: true },
    { location: 'footer',  label: 'Terms',      href: '/terms',      sortOrder: 20, visible: true },
    { location: 'footer',  label: 'Contact',    href: '/contact',    sortOrder: 30, visible: true },
  ];
  for (const n of navItems) {
    const existing = await nav.findOne({ where: { location: n.location!, href: n.href! } });
    if (!existing) await nav.save(nav.create(n));
  }

  // ── branding ────────────────────────────────────────────────────────────
  await brand.upsert(
    { key: 'logo', url: '/brand/logo.svg', mime: 'image/svg+xml' } as BrandingAssetEntity, ['key'],
  );
  await brand.upsert(
    { key: 'favicon', url: '/brand/favicon.svg', mime: 'image/svg+xml' } as BrandingAssetEntity, ['key'],
  );

  // ── email templates ─────────────────────────────────────────────────────
  // Templates are now defined in code at backend/src/core/mail/templates/*.
  // Seeding upserts them into the DB so admins can override via the admin UI.
  for (const [key, tpl] of Object.entries(builtInTemplates)) {
    await templates.upsert(
      { key, subject: tpl.subject, html: tpl.html } as any,
      ['key'],
    );
  }

  // eslint-disable-next-line no-console
  console.log('✅ Seed complete.');
  await AppDataSource.destroy();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
