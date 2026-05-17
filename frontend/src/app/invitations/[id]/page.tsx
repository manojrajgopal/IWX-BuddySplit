import { AppShell } from '@/components/layout/AppShell';
import { apiServer } from '@/lib/api/server';
import { getSession } from '@/lib/auth/session';
import { InvitationActions } from './InvitationActions';

interface Invitation {
  id: string; workspaceName: string; inviterName: string;
  email: string; status: string; expiresAt: string;
}

export default async function InvitationPage(
  { params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> },
): Promise<JSX.Element> {
  const { id } = await params;
  const { token = '' } = await searchParams;
  const [inv, session] = await Promise.all([
    apiServer<Invitation>(`/v1/invitations/${id}?token=${encodeURIComponent(token)}`, {
      revalidate: false, withAuth: false, throwOnError: false,
    }).catch(() => null),
    getSession(),
  ]);

  const returnUrl = `/invitations/${id}?token=${encodeURIComponent(token)}`;

  return (
    <AppShell>
      <div style={{ maxWidth: 520, margin: '4rem auto' }}>
        <div className="card">
          {!inv ? (
            <>
              <h2 className="card__title">Invitation not found</h2>
              <p className="text-secondary">The link may be invalid or expired.</p>
            </>
          ) : (
            <>
              <div className="text-uppercase-label">Invitation</div>
              <h2 className="card__title">{inv.workspaceName}</h2>
              <p className="card__subtitle">{inv.inviterName} invited <b>{inv.email}</b></p>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Status: {inv.status} · Expires {new Date(inv.expiresAt).toLocaleString()}</p>
              <div className="divider" />
              {inv.status === 'pending' ? (
                <InvitationActions
                  invitationId={inv.id}
                  token={token}
                  invitedEmail={inv.email}
                  loggedIn={!!session}
                  loggedInEmail={session?.email ?? null}
                  returnUrl={returnUrl}
                />
              ) : (
                <p className="text-secondary">This invitation has already been {inv.status}.</p>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
