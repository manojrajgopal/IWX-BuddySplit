'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

export function MembersInvite({ workspaceId }: { workspaceId: string }): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault(); setError(null); setBusy(true);
    try {
      await apiClient(`/v1/invitations/workspaces/${workspaceId}`, { method: 'POST', body: { email } });
      setEmail(''); setOpen(false); router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite');
    } finally { setBusy(false); }
  }

  if (!open) return <button className="btn btn--primary" onClick={() => setOpen(true)}>Invite member</button>;
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
      <input className="input" type="email" required placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send'}</button>
      <button className="btn btn--ghost" type="button" onClick={() => setOpen(false)}>Cancel</button>
      {error && <span className="field__error">{error}</span>}
    </form>
  );
}
