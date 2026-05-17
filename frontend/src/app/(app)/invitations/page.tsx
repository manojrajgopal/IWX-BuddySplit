import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { apiServer } from '@/lib/api/server';
import { InvitationList } from './InvitationList';

export const metadata = { title: 'Invitations' };

interface Invitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  inviterName: string;
  role: string;
  email: string;
  expiresAt: string;
  createdAt: string;
}

export default async function InvitationsPage(): Promise<JSX.Element> {
  const session = await getSession();
  if (!session) redirect('/login');

  const invitations = await apiServer<Invitation[]>('/v1/invitations/mine', {
    revalidate: false,
    throwOnError: false,
  }).catch(() => []) ?? [];

  return (
    <AppShell>
      <header className="page-head">
        <div>
          <div className="page-head__eyebrow">Your account</div>
          <h1>Invitations</h1>
          <p className="page-head__sub">
            Circle invitations sent to <strong>{session.email}</strong>. Accept to join or decline to dismiss.
          </p>
        </div>
      </header>
      <InvitationList invitations={invitations} />
    </AppShell>
  );
}
