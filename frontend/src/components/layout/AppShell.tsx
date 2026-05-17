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
        { href: '/dashboard',     label: 'Dashboard',     icon: 'home',     exact: true },
        { href: '/circles',       label: 'Circles',       icon: 'circles' },
        { href: '/activity',      label: 'Activity',      icon: 'activity' },
        { href: '/reports',       label: 'Reports',       icon: 'reports' },
      ],
    },
    {
      title: 'You',
      items: [
        { href: '/friends',       label: 'Friends',       icon: 'friends' },
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
    <>
      <span>© {new Date().getFullYear()} {companyName}. All rights reserved.</span>
      <div className="app-main__footer-links">
        <Link href="/about">About</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/help">Help</Link>
      </div>
    </>
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
