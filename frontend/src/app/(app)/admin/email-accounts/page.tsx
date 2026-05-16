import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { apiServer } from '@/lib/api/server';
import { EmailAccountsClient, EmailAccount } from './EmailAccountsClient';

export const dynamic = 'force-dynamic';

export default async function EmailAccountsPage(): Promise<JSX.Element> {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/dashboard');

  const accounts = await apiServer<EmailAccount[]>('/v1/admin/email-accounts', {
    revalidate: false, throwOnError: false,
  }).catch(() => [] as EmailAccount[]);

  return (
    <AppShell>
      <header style={{ marginBottom: '1.5rem' }}>
        <div className="text-uppercase-label">Admin · Email</div>
        <h1>Email accounts</h1>
        <p className="text-secondary" style={{ maxWidth: 720 }}>
          Configure one or more outbound email accounts. Pick the active default account; all
          system mail (OTP, invitations, notifications) will be sent through it.
        </p>
      </header>
      <EmailAccountsClient initial={accounts ?? []} />
    </AppShell>
  );
}
