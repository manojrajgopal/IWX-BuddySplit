'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

interface Props {
  invitationId: string;
  token: string;
  invitedEmail: string;
  loggedIn: boolean;
  loggedInEmail: string | null;
  returnUrl: string;
}

export function InvitationActions({ invitationId, token, invitedEmail, loggedIn, loggedInEmail, returnUrl }: Props): JSX.Element {
  const router = useRouter();
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Not logged in → prompt to login/register
  if (!loggedIn) {
    const loginHref = `/login?next=${encodeURIComponent(returnUrl)}`;
    const registerHref = `/register?next=${encodeURIComponent(returnUrl)}`;
    return (
      <div>
        <p className="text-secondary" style={{ marginBottom: '1rem' }}>
          You need to sign in as <b>{invitedEmail}</b> to accept this invitation.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href={loginHref} className="btn btn--primary">Sign in</Link>
          <Link href={registerHref} className="btn btn--outline">Create account</Link>
        </div>
      </div>
    );
  }

  // Logged in but with a different email
  if (loggedInEmail && loggedInEmail.toLowerCase() !== invitedEmail.toLowerCase()) {
    return (
      <div>
        <p className="text-secondary" style={{ marginBottom: '0.5rem' }}>
          This invitation is for <b>{invitedEmail}</b>, but you are signed in as <b>{loggedInEmail}</b>.
        </p>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>
          Please sign out and sign in with the correct account, or decline this invitation.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button className="btn btn--outline" onClick={() => act('decline')} disabled={busy !== null}>
            {busy === 'decline' ? 'Declining…' : 'Decline'}
          </button>
        </div>
        {error && <span className="field__error">{error}</span>}
      </div>
    );
  }

  async function act(action: 'accept' | 'decline'): Promise<void> {
    setError(null); setBusy(action);
    try {
      const res = await apiClient<{ workspaceId?: string }>(`/v1/invitations/${invitationId}/${action}`, {
        method: 'POST', body: { token },
      });
      if (action === 'accept' && res.workspaceId) router.push(`/circles/${res.workspaceId}`);
      else router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally { setBusy(null); }
  }

  return (
    <div style={{ display: 'flex', gap: '0.75rem' }}>
      <button className="btn btn--primary" onClick={() => act('accept')} disabled={busy !== null}>
        {busy === 'accept' ? 'Accepting…' : 'Accept'}
      </button>
      <button className="btn btn--outline" onClick={() => act('decline')} disabled={busy !== null}>
        {busy === 'decline' ? 'Declining…' : 'Decline'}
      </button>
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}
