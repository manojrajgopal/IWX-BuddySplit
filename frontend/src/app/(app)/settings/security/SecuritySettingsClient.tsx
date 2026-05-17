'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { evaluatePassword, PASSWORD_MIN_LENGTH } from '@/lib/password';

interface SessionResp { id: string; device: string; createdAt: string; lastActiveAt: string; current?: boolean }

export function SecuritySettingsClient(): JSX.Element {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const strength = evaluatePassword(next);
  const canSubmit = current.length > 0 && strength.allOk && next === confirm;

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault(); setMsg(null); setBusy(true);
    try {
      await apiClient('/v1/auth/change-password', { method: 'POST', body: { currentPassword: current, newPassword: next, confirmPassword: confirm } });
      setMsg({ kind: 'ok', text: 'Password updated. Other devices have been signed out.' });
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err) {
      setMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Failed to change password.' });
    } finally { setBusy(false); }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <div className="page-head__eyebrow">Settings</div>
          <h1>Security</h1>
          <p className="page-head__sub">Change your password, review active sessions, and tighten how you sign in.</p>
        </div>
        <div className="page-head__actions">
          <Link href="/settings" className="btn btn--ghost btn--sm">Profile</Link>
          <Link href="/settings/notifications" className="btn btn--ghost btn--sm">Notifications</Link>
        </div>
      </header>

      <div className="card" style={{ marginBottom: '2rem', maxWidth: 640 }}>
        <h3 className="card__title">Change password</h3>
        <p className="card__subtitle">Use at least {PASSWORD_MIN_LENGTH} characters with upper, lower, number, and symbol. Other devices will be signed out.</p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label className="label">Current password</label>
            <input className="input" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">New password</label>
            <input className="input" type="password" autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} />
            {next.length > 0 && (
              <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.35rem' }}>Strength: {strength.label}</div>
            )}
          </div>
          <div className="field">
            <label className="label">Confirm new password</label>
            <input className="input" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {confirm.length > 0 && next !== confirm && <div className="field__error">Passwords don&apos;t match.</div>}
          </div>
          {msg && <div className={msg.kind === 'ok' ? 'text-positive' : 'field__error'} style={{ marginBottom: '0.75rem' }}>{msg.text}</div>}
          <button type="submit" className="btn btn--primary" disabled={!canSubmit || busy}>{busy ? 'Updating…' : 'Update password'}</button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="card__title">Two-factor authentication</h3>
        <p className="card__subtitle">Add a second factor for sign-in to make takeover much harder.</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          <button type="button" className="btn btn--outline" disabled>Set up authenticator (coming soon)</button>
          <button type="button" className="btn btn--ghost" disabled>Recovery codes (coming soon)</button>
        </div>
      </div>

      <div className="card">
        <h3 className="card__title">Account safety tips</h3>
        <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.8 }}>
          <li>Use a unique password — never reuse from another service.</li>
          <li>Verify your email so password resets reach you reliably.</li>
          <li>Sign out of devices you no longer use.</li>
          <li>If you suspect a compromise, change your password immediately — all other sessions are invalidated.</li>
        </ul>
      </div>
    </>
  );
}
