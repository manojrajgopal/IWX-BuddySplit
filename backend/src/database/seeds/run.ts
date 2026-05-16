import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
loadEnv();

import { AppDataSource } from '../data-source';
import { UserEntity } from '@/modules/users/entities/user.entity';
import { SiteSettingEntity } from '@/modules/settings/entities/site-setting.entity';
import { NavigationItemEntity } from '@/modules/navigation/entities/navigation-item.entity';
import { BrandingAssetEntity } from '@/modules/branding/entities/branding-asset.entity';
import { EmailTemplateEntity } from '@/modules/email/entities/email-template.entity';
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
  let admin = await users.findOne({ where: { email: adminEmail } });
  if (!admin) {
    const passwordHash = await argon2.hash('admin123!' + (process.env.PASSWORD_PEPPER ?? ''), { type: argon2.argon2id });
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
  }

  // ── site settings (public) ──────────────────────────────────────────────
  const publicSettings: Array<[string, unknown]> = [
    ['app.name', 'IWX-BuddySplit'],
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
  const baseStyles = `font-family: Inter, sans-serif; color: #111; line-height: 1.6;`;
  const templatesData: Array<Partial<EmailTemplateEntity>> = [
    {
      key: 'auth.otp.register',
      subject: 'Your IWX-BuddySplit verification code: {{code}}',
      html: `<div style="${baseStyles}">
        <h2>Verify your email</h2>
        <p>Your verification code is:</p>
        <p style="font-size:28px;letter-spacing:6px;font-weight:700">{{code}}</p>
        <p>This code expires in {{ttlMinutes}} minutes.</p>
      </div>`,
    },
    {
      key: 'auth.otp.reset_password',
      subject: 'Reset your IWX-BuddySplit password',
      html: `<div style="${baseStyles}">
        <h2>Reset your password</h2>
        <p>Use this code to reset your password:</p>
        <p style="font-size:28px;letter-spacing:6px;font-weight:700">{{code}}</p>
        <p>This code expires in {{ttlMinutes}} minutes. If you didn't request this, ignore this email.</p>
      </div>`,
    },
    {
      key: 'invite.sent',
      subject: '{{inviterName}} invited you to "{{workspaceName}}"',
      html: `<div style="${baseStyles}">
        <h2>You're invited</h2>
        <p><b>{{inviterName}}</b> invited you to the workspace <b>{{workspaceName}}</b> on IWX-BuddySplit.</p>
        <p><a href="{{acceptUrl}}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;border-radius:8px;text-decoration:none">Open invitation</a></p>
      </div>`,
    },
  ];
  for (const t of templatesData) {
    const existing = await templates.findOne({ where: { key: t.key! } });
    if (!existing) await templates.save(templates.create(t));
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
