'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

export function InvitationActions({ invitationId, token }: { invitationId: string; token: string }): JSX.Element {
  const router = useRouter();
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: 'accept' | 'decline'): Promise<void> {
    setError(null); setBusy(action);
    try {
      const res = await apiClient<{ workspaceId?: string }>(`/v1/invitations/${invitationId}/${action}`, {
        method: 'POST', body: { token },
      });
      if (action === 'accept' && res.workspaceId) router.push(`/workspaces/${res.workspaceId}`);
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
