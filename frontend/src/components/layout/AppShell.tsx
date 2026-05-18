import { ReactNode } from 'react';
import Link from 'next/link';
import { getBranding, getPublicSettings, settingString } from '@/lib/cms';
import { getSession } from '@/lib/auth/session';
import { apiServer } from '@/lib/api/server';
import { AppShellClient } from './AppShellClient';
import type { SidebarGroup } from './Sidebar';

function buildGroups(isAdmin: boolean, unread: number): SidebarGroup[] {
  const groups: SidebarGroup[] = [
    {
      title: 'Explore',
      items: [
        { href: '/dashboard',     label: 'Home',          icon: 'home',     exact: true },
        { href: '/circles',       label: 'Circles',       icon: 'circles' },
        { href: '/activity',      label: 'Activity',      icon: 'activity' },
        { href: '/reports',       label: 'Reports',       icon: 'reports' },
      ],
    },
    {
      title: 'You',
      items: [
        { href: '/friends',       label: 'Friends',       icon: 'friends' },
        { href: '/invitations',   label: 'Invitations',   icon: 'mail' },
        { href: '/notifications', label: 'Notifications', icon: 'bell', count: unread },
        { href: '/profile',       label: 'Profile',       icon: 'user' },
        { href: '/settings',      label: 'Settings',      icon: 'settings' },
        { href: '/help',          label: 'Help center',   icon: 'help' },
      ],
    },
  ];
  if (isAdmin) {
    groups.push({
      title: 'Admin',
      items: [
        { href: '/admin',                label: 'Admin overview', icon: 'shield', exact: true },
        { href: '/admin/roles',          label: 'Roles',          icon: 'shield' },
        { href: '/admin/email-accounts', label: 'Email accounts', icon: 'settings' },
      ],
    });
  }
  return groups;
}

export async function AppShell({ children }: { children: ReactNode }): Promise<JSX.Element> {
  const [settings, brand, session] = await Promise.all([
    getPublicSettings(),
    getBranding(),
    getSession(),
  ]);

  const appName = settingString(settings, 'app.name', 'IWX BuddySplit');
  const tagline = settingString(settings, 'app.tagline', 'Split smart');
  const companyName = settingString(settings, 'company.name', appName);
  const logoUrl = brand['logo']?.url;

  let unread = 0;
  let displayName: string | null = null;
  if (session) {
    const [unreadData, profile] = await Promise.all([
      apiServer<{ count: number }>('/v1/notifications/unread-count', {
        revalidate: false, throwOnError: false,
      }).catch(() => null),
      apiServer<{ displayName?: string | null }>('/v1/users/me', {
        revalidate: false, throwOnError: false,
      }).catch(() => null),
    ]);
    unread = unreadData?.count ?? 0;
    displayName = profile?.displayName ?? null;
  }

  const isAdmin = session?.role === 'admin';
  const groups = buildGroups(!!isAdmin, unread);

  const sidebarFooter = session ? (
    <>
      <div className="app-sidebar__footer-row">
        <span>{appName}</span>
        <span>v1.0</span>
      </div>
      <div className="app-sidebar__footer-links">
        <Link href="/help">Help</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/about">About</Link>
      </div>
    </>
  ) : null;

  const footer = (
    <div className="app-footer-rich">
      <div className="app-footer-rich__grid">
        <div className="app-footer-rich__col app-footer-rich__col--brand">
          <div className="app-footer-rich__brand">
            {logoUrl ? <img src={logoUrl} alt={appName} className="app-footer-rich__logo" /> : null}
            <strong>{appName}</strong>
          </div>
          <p className="app-footer-rich__tagline">{tagline}. Split bills, track balances, settle smart — together.</p>
          <div className="app-footer-rich__socials" aria-label="Follow us">
            <a href="https://twitter.com" target="_blank" rel="noreferrer noopener" aria-label="Twitter">𝕏</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer noopener" aria-label="Instagram">IG</a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer noopener" aria-label="LinkedIn">in</a>
            <a href="https://github.com" target="_blank" rel="noreferrer noopener" aria-label="GitHub">GH</a>
          </div>
        </div>
        <div className="app-footer-rich__col">
          <h6 className="app-footer-rich__title">Product</h6>
          <Link href="/dashboard">Home</Link>
          <Link href="/circles">Circles</Link>
          <Link href="/activity">Activity</Link>
          <Link href="/reports">Reports</Link>
          <Link href="/friends">Friends</Link>
        </div>
        <div className="app-footer-rich__col">
          <h6 className="app-footer-rich__title">Account</h6>
          <Link href="/profile">Profile</Link>
          <Link href="/settings">Settings</Link>
          <Link href="/notifications">Notifications</Link>
          <Link href="/invitations">Invitations</Link>
        </div>
        <div className="app-footer-rich__col">
          <h6 className="app-footer-rich__title">Company</h6>
          <Link href="/about">About</Link>
          <Link href="/help">Help center</Link>
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/terms">Terms of service</Link>
        </div>
      </div>
      <div className="app-footer-rich__bar">
        <span>© {new Date().getFullYear()} {companyName}. All rights reserved.</span>
        <span className="app-footer-rich__build">Made with care · v1.0</span>
      </div>
    </div>
  );

  return (
    <AppShellClient
      brand={{ name: appName, tagline, logoUrl }}
      groups={groups}
      session={session ? { email: session.email, displayName: displayName || null, isAdmin } : null}
      unreadNotifications={unread}
      sidebarFooter={sidebarFooter}
      footer={footer}
    >
      {children}
    </AppShellClient>
  );
}
