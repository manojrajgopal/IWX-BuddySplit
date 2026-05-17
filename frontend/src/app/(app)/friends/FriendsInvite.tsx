'use client';
import { FormEvent, useState } from 'react';
import { apiClient } from '@/lib/api/client';

export function FriendsInvite(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault(); setMsg(null); setBusy(true);
    try {
      await apiClient('/v1/friends/invite', { method: 'POST', body: { email: email.trim().toLowerCase() } });
      setMsg({ kind: 'ok', text: 'Invite sent.' });
      setEmail('');
    } catch (err) {
      setMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Failed to send invite.' });
    } finally { setBusy(false); }
  }

  if (!open) return <button type="button" className="btn btn--primary" onClick={() => setOpen(true)}>Invite a buddy</button>;
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 320 }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input className="input" type="email" required placeholder="friend@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn btn--primary" type="submit" disabled={busy || email.length < 3}>{busy ? 'Sending…' : 'Send'}</button>
        <button className="btn btn--ghost" type="button" onClick={() => { setOpen(false); setMsg(null); }}>Cancel</button>
      </div>
      {msg && <span className={msg.kind === 'ok' ? 'text-positive' : 'field__error'} style={{ fontSize: '0.8rem' }}>{msg.text}</span>}
    </form>
  );
}
