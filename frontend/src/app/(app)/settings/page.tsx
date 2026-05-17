import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { apiServer } from '@/lib/api/server';
import { SettingsEditor } from './SettingsEditor';
import { AccountSettings } from './AccountSettings';

export default async function SettingsPage(): Promise<JSX.Element> {
  const session = await getSession();
  if (!session) redirect('/login');

  // Admin → site-wide settings
  if (session.role === 'admin') {
    const siteSettings = await apiServer<Record<string, unknown>>('/v1/settings/public', { revalidate: false, throwOnError: false }).catch(() => ({} as Record<string, unknown>));
    return (
      <AppShell>
        <header style={{ marginBottom: '2rem' }}>
          <div className="text-uppercase-label">Admin · Configuration</div>
          <h1>Settings</h1>
          <p className="text-secondary">Manage public application settings.</p>
        </header>
        <SettingsEditor initialSettings={siteSettings ?? {}} />
      </AppShell>
    );
  }

  // Regular user → account settings
  const profile = await apiServer<{
    id: string; email: string; displayName: string; phone: string | null;
    avatarUrl: string | null; emailVerifiedAt: string | null; createdAt: string;
  }>('/v1/users/me', { revalidate: false, throwOnError: false }).catch(() => null);

  if (!profile) redirect('/login');

  return (
    <AppShell>
      <header style={{ marginBottom: '2rem' }}>
        <div className="text-uppercase-label">Account</div>
        <h1>Settings</h1>
        <p className="text-secondary">Manage your profile and account preferences.</p>
      </header>
      <AccountSettings profile={profile} />
    </AppShell>
  );
}
