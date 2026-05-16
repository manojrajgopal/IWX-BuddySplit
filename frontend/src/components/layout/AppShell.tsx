import { ReactNode } from 'react';
import { getBranding, getNavigation, getPublicSettings, settingString } from '@/lib/cms';
import { BrandLogo } from '@/components/cms/BrandLogo';
import { DynamicNav } from '@/components/cms/DynamicNav';
import { getSession } from '@/lib/auth/session';
import Link from 'next/link';

export async function AppShell({ children }: { children: ReactNode }): Promise<JSX.Element> {
  const [settings, brand, primary, admin, footer, session] = await Promise.all([
    getPublicSettings(),
    getBranding(),
    getNavigation('primary'),
    getNavigation('admin'),
    getNavigation('footer'),
    getSession(),
  ]);
  const appName = settingString(settings, 'app.name', 'IWX-BuddySplit');
  const adminItems = session?.role === 'admin' ? admin : [];

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <BrandLogo brand={brand} appName={appName} href={session ? '/dashboard' : '/'} />
        <DynamicNav items={primary} />
        {adminItems.length > 0 && (
          <>
            <div className="divider" />
            <div className="text-uppercase-label" style={{ padding: '0 0.85rem 0.5rem' }}>Admin</div>
            <DynamicNav items={adminItems} />
          </>
        )}
      </aside>
      <div className="shell__main">
        <header className="shell__topbar">
          <div style={{ flex: 1 }} />
          {session ? (
            <>
              <span className="text-secondary" style={{ fontSize: '0.85rem' }}>{session.email}</span>
              <form action="/api/auth/logout" method="post"><button className="btn btn--ghost btn--sm" type="submit">Logout</button></form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn--ghost btn--sm">Login</Link>
              <Link href="/register" className="btn btn--primary btn--sm">Sign up</Link>
            </>
          )}
        </header>
        <main className="shell__content fade-in">{children}</main>
        <footer className="footer">
          <span>{settingString(settings, 'footer.text', '')}</span>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {footer.map((f) => <Link key={f.id} href={f.href}>{f.label}</Link>)}
          </div>
        </footer>
      </div>
    </div>
  );
}
