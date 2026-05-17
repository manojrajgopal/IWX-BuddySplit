'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

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

export function InvitationList({ invitations: initial }: { invitations: Invitation[] }): JSX.Element {
  const router = useRouter();
  const [invitations, setInvitations] = useState(initial);
  const [busy, setBusy] = useState<Record<string, 'accept' | 'decline' | null>>({});
  const [messages, setMessages] = useState<Record<string, { type: 'ok' | 'err'; text: string }>>({});

  async function handleAccept(inv: Invitation): Promise<void> {
    setBusy((b) => ({ ...b, [inv.id]: 'accept' }));
    setMessages((m) => { const next = { ...m }; delete next[inv.id]; return next; });
    try {
      const res = await apiClient<{ workspaceId: string }>(`/v1/invitations/${inv.id}/accept`, {
        method: 'POST',
        body: {},
      });
      setInvitations((list) => list.filter((i) => i.id !== inv.id));
      setMessages((m) => ({ ...m, [inv.id]: { type: 'ok', text: `Joined "${inv.workspaceName}"!` } }));
      setTimeout(() => router.push(`/circles/${res.workspaceId}`), 1500);
    } catch (err) {
      setMessages((m) => ({ ...m, [inv.id]: { type: 'err', text: err instanceof Error ? err.message : 'Failed to accept' } }));
    } finally {
      setBusy((b) => ({ ...b, [inv.id]: null }));
    }
  }

  async function handleDecline(inv: Invitation): Promise<void> {
    setBusy((b) => ({ ...b, [inv.id]: 'decline' }));
    setMessages((m) => { const next = { ...m }; delete next[inv.id]; return next; });
    try {
      await apiClient(`/v1/invitations/${inv.id}/decline-auth`, {
        method: 'POST',
        body: {},
      });
      setInvitations((list) => list.filter((i) => i.id !== inv.id));
      setMessages((m) => ({ ...m, [inv.id]: { type: 'ok', text: 'Invitation declined.' } }));
    } catch (err) {
      setMessages((m) => ({ ...m, [inv.id]: { type: 'err', text: err instanceof Error ? err.message : 'Failed to decline' } }));
    } finally {
      setBusy((b) => ({ ...b, [inv.id]: null }));
    }
  }

  const successMessages = Object.entries(messages).filter(([id]) => !invitations.some((i) => i.id === id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {successMessages.map(([id, msg]) => (
        <div key={id} className={`auth-alert auth-alert--${msg.type === 'ok' ? 'success' : 'error'}`} role="status">
          <span>{msg.text}</span>
        </div>
      ))}

      {invitations.length === 0 && successMessages.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p className="text-secondary" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No pending invitations</p>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>When someone invites you to a circle, it will appear here.</p>
        </div>
      )}

      {invitations.map((inv) => {
        const loading = busy[inv.id];
        const msg = messages[inv.id];
        const expiresDate = new Date(inv.expiresAt);
        const createdDate = new Date(inv.createdAt);
        const daysLeft = Math.max(0, Math.ceil((expiresDate.getTime() - Date.now()) / 86400000));

        return (
          <div key={inv.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h3 className="card__title" style={{ marginBottom: '0.25rem' }}>{inv.workspaceName}</h3>
                <p className="text-secondary" style={{ margin: 0, fontSize: '0.9rem' }}>
                  <strong>{inv.inviterName}</strong> invited you as <span className="pill" style={{ fontSize: '0.75rem' }}>{inv.role}</span>
                </p>
                <p className="text-muted" style={{ margin: '0.5rem 0 0', fontSize: '0.8rem' }}>
                  Sent {createdDate.toLocaleDateString()} · {daysLeft > 0 ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : 'Expiring soon'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => handleDecline(inv)}
                  disabled={!!loading}
                >
                  {loading === 'decline' ? 'Declining…' : 'Decline'}
                </button>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => handleAccept(inv)}
                  disabled={!!loading}
                >
                  {loading === 'accept' ? 'Accepting…' : 'Accept'}
                </button>
              </div>
            </div>
            {msg && (
              <div className={`auth-alert auth-alert--${msg.type === 'ok' ? 'success' : 'error'}`} style={{ marginTop: '0.75rem' }} role="status">
                <span>{msg.text}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
