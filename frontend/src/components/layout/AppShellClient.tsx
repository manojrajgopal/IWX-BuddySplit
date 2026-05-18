'use client';
import { useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar, type SidebarGroup } from './Sidebar';
import { IconSearch, IconBell, IconMenu, IconX } from './Icons';
import { NavigationProvider } from './NavigationProvider';
import { NavLink } from './NavLink';
import { ThemeToggle } from './ThemeToggle';

// Lazy-load interactive menus — they only need to render after hydration.
const UserMenu = dynamic(() => import('./UserMenu').then(m => m.UserMenu), { ssr: false });

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
    <NavigationProvider>
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

        <NavLink href={session ? '/dashboard' : '/'} className="app-topbar__brand" aria-label={brand.name}>
          <span className={`app-topbar__brand-mark${brand.logoUrl ? '' : ' app-topbar__brand-mark--hidden'}`}>
            {brand.logoUrl && <img src={brand.logoUrl} alt="" width={32} height={32} />}
          </span>
          <span className="app-topbar__brand-name">
            <span>{brand.name}</span>
            {brand.tagline && <span className="app-topbar__brand-sub">{brand.tagline}</span>}
          </span>
        </NavLink>

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
              <ThemeToggle />
              <NavLink href="/notifications" className="app-topbar__icon-btn" title="Notifications" aria-label="Notifications">
                <IconBell size={20} />
                {unreadNotifications > 0 && (
                  <span className="app-topbar__badge">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>
                )}
              </NavLink>
              <UserMenu email={session.email} displayName={session.displayName} isAdmin={session.isAdmin} />
            </>
          ) : (
            <>
              <NavLink href="/login" className="btn btn--ghost btn--sm">Sign in</NavLink>
              <NavLink href="/register" className="btn btn--primary btn--sm">Create account</NavLink>
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
    </NavigationProvider>
  );
}
