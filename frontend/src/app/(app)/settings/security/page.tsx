import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { SecuritySettingsClient } from './SecuritySettingsClient';

export default async function SecuritySettingsPage(): Promise<JSX.Element> {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <AppShell>
      <SecuritySettingsClient />
    </AppShell>
  );
}
