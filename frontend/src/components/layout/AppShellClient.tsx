'use client';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Sidebar, type SidebarGroup } from './Sidebar';
import { UserMenu } from './UserMenu';
import { CreateMenu } from './CreateMenu';
import { IconSearch, IconBell, IconMenu, IconX } from './Icons';

interface Brand { name: string; tagline?: string; logoUrl?: string }
interface SessionInfo { email: string; displayName?: string | null; isAdmin?: boolean }

interface Props {
  brand: Brand;
  groups: SidebarGroup[];
  session: SessionInfo | null;
  unreadNotifications?: number;
  sidebarFooter?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AppShellClient({ brand, groups, session, unreadNotifications = 0, sidebarFooter, children, footer }: Props): JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={'app-shell' + (session ? '' : ' app-shell--no-sidebar')}>
      <header className="app-topbar">
        <button
          type="button"
          className="app-topbar__icon-btn app-mobile-toggle"
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          onClick={() => setMobileOpen(o => !o)}
        >
          {mobileOpen ? <IconX size={20} /> : <IconMenu size={20} />}
        </button>

        <Link href={session ? '/dashboard' : '/'} className="app-topbar__brand" aria-label={brand.name}>
          <span className={`app-topbar__brand-mark${brand.logoUrl ? '' : ' app-topbar__brand-mark--hidden'}`}>
            {brand.logoUrl && <img src={brand.logoUrl} alt="" width={32} height={32} />}
          </span>
          <span className="app-topbar__brand-name">
            <span>{brand.name}</span>
            {brand.tagline && <span className="app-topbar__brand-sub">{brand.tagline}</span>}
          </span>
        </Link>

        <label className="app-topbar__search">
          <span className="app-topbar__search-icon"><IconSearch size={16} /></span>
          <input
            type="search"
            placeholder="Search circles, expenses, members\u2026"
            aria-label="Search"
          />
          <kbd className="app-topbar__search-kbd">/</kbd>
        </label>

        <div className="app-topbar__actions">
          {session ? (
            <>
              <CreateMenu />
              <Link href="/notifications" className="app-topbar__icon-btn" title="Notifications" aria-label="Notifications">
                <IconBell size={20} />
                {unreadNotifications > 0 && (
                  <span className="app-topbar__badge">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>
                )}
              </Link>
              <UserMenu email={session.email} displayName={session.displayName} isAdmin={session.isAdmin} />
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn--ghost btn--sm">Sign in</Link>
              <Link href="/register" className="btn btn--primary btn--sm">Create account</Link>
            </>
          )}
        </div>
      </header>

      {session && (
        <Sidebar
          groups={groups}
          footer={sidebarFooter}
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
      )}

      <div className="app-main">
        <main className="app-main__content fade-in">{children}</main>
        {footer && <footer className="app-main__footer">{footer}</footer>}
      </div>
    </div>
  );
}
