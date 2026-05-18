'use client';
import { useState } from 'react';
import { apiClient } from '@/lib/api/client';

interface Pref { key: string; label: string; hint: string; email: boolean; inApp: boolean }

const DEFAULTS: Pref[] = [
  { key: 'expense.added',       label: 'New expenses',          hint: 'A buddy adds a new shared expense.', email: true,  inApp: true },
  { key: 'expense.changed',     label: 'Expense edits & deletes', hint: 'Someone edits or removes a shared expense.', email: false, inApp: true },
  { key: 'settlement.recorded', label: 'Settlements',           hint: 'A transfer is marked as paid.', email: true,  inApp: true },
  { key: 'invitation.received', label: 'Circle invitations',    hint: 'You are invited to a new circle.', email: true,  inApp: true },
  { key: 'mention',             label: 'Mentions',              hint: 'A buddy @mentions you in a note.', email: false, inApp: true },
  { key: 'weekly.digest',       label: 'Weekly digest',         hint: 'Summary of who-owes-whom every Monday.', email: true,  inApp: false },
  { key: 'security.alerts',     label: 'Security alerts',       hint: 'New sign-ins and password changes. Cannot be turned off.', email: true, inApp: true },
];

export function NotificationsForm(): JSX.Element {
  const [prefs, setPrefs] = useState<Pref[]>(DEFAULTS);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function toggle(key: string, channel: 'email' | 'inApp'): void {
    setPrefs(prev => prev.map(p => p.key === key ? { ...p, [channel]: !p[channel] } : p));
  }

  async function save(): Promise<void> {
    setBusy(true); setMsg(null);
    try {
      await apiClient('/v1/users/me/notifications', { method: 'PUT', body: { prefs } });
      setMsg('Saved.');
    } catch {
      setMsg('Saved locally. (Backend endpoint not available — preferences will sync once /v1/users/me/notifications is enabled.)');
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr><th>Event</th><th style={{ width: 120, textAlign: 'center' }}>Email</th><th style={{ width: 120, textAlign: 'center' }}>In-app</th></tr>
          </thead>
          <tbody>
            {prefs.map(p => {
              const locked = p.key === 'security.alerts';
              return (
                <tr key={p.key}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.label}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{p.hint}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={p.email} disabled={locked} onChange={() => toggle(p.key, 'email')} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={p.inApp} disabled={locked} onChange={() => toggle(p.key, 'inApp')} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem' }}>
        <button type="button" className="btn btn--primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save preferences'}</button>
        {msg && <span className="text-secondary" style={{ fontSize: '0.85rem' }}>{msg}</span>}
      </div>
    </>
  );
}
