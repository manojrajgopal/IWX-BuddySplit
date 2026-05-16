'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

export interface EmailAccount {
  id: string;
  name: string;
  provider: 'smtp' | 'gmail_oauth';
  fromAddress: string;
  isActive: boolean;
  isDefault: boolean;
  lastUsedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  config: Record<string, string | number | boolean>;
}

type SmtpForm = {
  host: string; port: number; secure: boolean; user: string; password: string;
};
type GmailForm = {
  clientId: string; clientSecret: string; redirectUri: string;
  refreshToken: string; accessToken: string;
};
type FormState = {
  id?: string;
  name: string;
  provider: 'smtp' | 'gmail_oauth';
  fromAddress: string;
  isActive: boolean;
  isDefault: boolean;
  smtp: SmtpForm;
  gmail: GmailForm;
};

const EMPTY: FormState = {
  name: '',
  provider: 'smtp',
  fromAddress: '',
  isActive: true,
  isDefault: false,
  smtp: { host: 'localhost', port: 1025, secure: false, user: '', password: '' },
  gmail: { clientId: '', clientSecret: '', redirectUri: '', refreshToken: '', accessToken: '' },
};

export function EmailAccountsClient({ initial }: { initial: EmailAccount[] }): JSX.Element {
  const router = useRouter();
  const [accounts, setAccounts] = useState<EmailAccount[]>(initial);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testTarget, setTestTarget] = useState('');
  const [pending, startTransition] = useTransition();

  function refresh(): void {
    startTransition(() => router.refresh());
  }

  async function reload(): Promise<void> {
    const data = await apiClient<EmailAccount[]>('/v1/admin/email-accounts').catch(() => []);
    setAccounts(data ?? []);
  }

  function resetForm(): void {
    setForm(EMPTY);
    setEditing(false);
    setError(null);
    setMessage(null);
  }

  function startEdit(acc: EmailAccount): void {
    setEditing(true);
    setError(null);
    setMessage(null);
    setForm({
      id: acc.id,
      name: acc.name,
      provider: acc.provider,
      fromAddress: acc.fromAddress,
      isActive: acc.isActive,
      isDefault: acc.isDefault,
      smtp: acc.provider === 'smtp' ? {
        host: String(acc.config.host ?? ''),
        port: Number(acc.config.port ?? 587),
        secure: Boolean(acc.config.secure),
        user: String(acc.config.user ?? ''),
        password: '', // masked — leave blank to keep current
      } : EMPTY.smtp,
      gmail: acc.provider === 'gmail_oauth' ? {
        clientId: String(acc.config.clientId ?? ''),
        clientSecret: '',
        redirectUri: String(acc.config.redirectUri ?? ''),
        refreshToken: '',
        accessToken: '',
      } : EMPTY.gmail,
    });
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const body = {
      name: form.name,
      provider: form.provider,
      fromAddress: form.fromAddress,
      isActive: form.isActive,
      isDefault: form.isDefault,
      config: form.provider === 'smtp' ? form.smtp : form.gmail,
    };
    try {
      if (editing && form.id) {
        await apiClient<EmailAccount>(`/v1/admin/email-accounts/${form.id}`, { method: 'PATCH', body });
        setMessage('Updated.');
      } else {
        await apiClient<EmailAccount>('/v1/admin/email-accounts', { method: 'POST', body });
        setMessage('Created.');
      }
      await reload();
      resetForm();
      refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove(id: string): Promise<void> {
    if (!confirm('Delete this email account?')) return;
    try {
      await apiClient(`/v1/admin/email-accounts/${id}`, { method: 'DELETE' });
      await reload();
      refresh();
    } catch (err) { setError((err as Error).message); }
  }

  async function setDefault(id: string): Promise<void> {
    try {
      await apiClient(`/v1/admin/email-accounts/${id}/set-default`, { method: 'POST' });
      await reload();
      refresh();
    } catch (err) { setError((err as Error).message); }
  }

  async function sendTest(id: string): Promise<void> {
    setMessage(null); setError(null);
    if (!testTarget) { setError('Enter a recipient email first.'); return; }
    try {
      const r = await apiClient<{ ok: boolean; error?: string }>(
        `/v1/admin/email-accounts/${id}/test`,
        { method: 'POST', body: { to: testTarget } },
      );
      if (r.ok) setMessage(`Test sent to ${testTarget}.`);
      else setError(r.error ?? 'Test send failed.');
      await reload();
    } catch (err) { setError((err as Error).message); }
  }

  return (
    <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 420px)' }}>
      <section>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Configured accounts</h2>
          {accounts.length === 0 && (
            <p className="text-secondary">No email accounts yet. Add one from the form to start sending mail.</p>
          )}
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {accounts.map((a) => (
              <div key={a.id} className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <strong>{a.name}</strong>
                      <span className="text-uppercase-label">{a.provider === 'smtp' ? 'SMTP' : 'Gmail OAuth'}</span>
                      {a.isDefault && <span className="text-uppercase-label" style={{ color: 'var(--color-success, #16a34a)' }}>Default</span>}
                      {!a.isActive && <span className="text-uppercase-label" style={{ color: 'var(--color-warning, #d97706)' }}>Inactive</span>}
                    </div>
                    <div className="text-secondary" style={{ fontSize: '0.85rem' }}>{a.fromAddress}</div>
                    {a.lastError && <div style={{ color: 'crimson', fontSize: '0.8rem' }}>Last error: {a.lastError}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button className="btn btn--ghost btn--sm" onClick={() => startEdit(a)} type="button">Edit</button>
                    {!a.isDefault && <button className="btn btn--ghost btn--sm" onClick={() => setDefault(a.id)} type="button">Make default</button>}
                    <button className="btn btn--ghost btn--sm" onClick={() => sendTest(a.id)} type="button">Test</button>
                    <button className="btn btn--ghost btn--sm" onClick={() => remove(a.id)} type="button" style={{ color: 'crimson' }}>Delete</button>
                  </div>
                </div>
                <details style={{ marginTop: '0.5rem' }}>
                  <summary className="text-secondary" style={{ cursor: 'pointer' }}>Config (secrets masked)</summary>
                  <pre style={{ fontSize: '0.78rem', overflow: 'auto' }}>{JSON.stringify(a.config, null, 2)}</pre>
                </details>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              className="input"
              placeholder="recipient@example.com (for test sends)"
              value={testTarget}
              onChange={(e) => setTestTarget(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>
        </div>
      </section>

      <section>
        <form className="card" onSubmit={submit}>
          <h2 style={{ marginTop: 0 }}>{editing ? 'Edit account' : 'Add account'}</h2>

          <label className="field">
            <span>Name</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="field">
            <span>From address</span>
            <input className="input" placeholder="App <noreply@example.com>" value={form.fromAddress}
              onChange={(e) => setForm({ ...form, fromAddress: e.target.value })} required />
          </label>
          <label className="field">
            <span>Provider</span>
            <select className="input" value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value as 'smtp' | 'gmail_oauth' })}>
              <option value="smtp">SMTP (host / port / user / password)</option>
              <option value="gmail_oauth">Gmail OAuth2 (client / refresh token)</option>
            </select>
          </label>

          {form.provider === 'smtp' && (
            <fieldset style={{ border: '1px solid var(--color-border, #e5e7eb)', padding: '0.75rem', borderRadius: 8 }}>
              <legend className="text-uppercase-label">SMTP credentials</legend>
              <label className="field"><span>SMTP_HOST</span>
                <input className="input" value={form.smtp.host}
                  onChange={(e) => setForm({ ...form, smtp: { ...form.smtp, host: e.target.value } })} required />
              </label>
              <label className="field"><span>SMTP_PORT</span>
                <input className="input" type="number" value={form.smtp.port}
                  onChange={(e) => setForm({ ...form, smtp: { ...form.smtp, port: Number(e.target.value) } })} required />
              </label>
              <label className="field" style={{ flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
                <input type="checkbox" checked={form.smtp.secure}
                  onChange={(e) => setForm({ ...form, smtp: { ...form.smtp, secure: e.target.checked } })} />
                <span>SMTP_SECURE (TLS)</span>
              </label>
              <label className="field"><span>SMTP_USER</span>
                <input className="input" value={form.smtp.user}
                  onChange={(e) => setForm({ ...form, smtp: { ...form.smtp, user: e.target.value } })} />
              </label>
              <label className="field"><span>SMTP_PASSWORD {editing && <em className="text-secondary">(leave blank to keep)</em>}</span>
                <input className="input" type="password" value={form.smtp.password}
                  onChange={(e) => setForm({ ...form, smtp: { ...form.smtp, password: e.target.value } })} />
              </label>
            </fieldset>
          )}

          {form.provider === 'gmail_oauth' && (
            <fieldset style={{ border: '1px solid var(--color-border, #e5e7eb)', padding: '0.75rem', borderRadius: 8 }}>
              <legend className="text-uppercase-label">Gmail OAuth credentials</legend>
              <label className="field"><span>GOOGLE_CLIENT_ID</span>
                <input className="input" value={form.gmail.clientId}
                  onChange={(e) => setForm({ ...form, gmail: { ...form.gmail, clientId: e.target.value } })} required />
              </label>
              <label className="field"><span>GOOGLE_CLIENT_SECRET {editing && <em className="text-secondary">(leave blank to keep)</em>}</span>
                <input className="input" type="password" value={form.gmail.clientSecret}
                  onChange={(e) => setForm({ ...form, gmail: { ...form.gmail, clientSecret: e.target.value } })} />
              </label>
              <label className="field"><span>GOOGLE_REDIRECT_URI</span>
                <input className="input" value={form.gmail.redirectUri}
                  onChange={(e) => setForm({ ...form, gmail: { ...form.gmail, redirectUri: e.target.value } })} />
              </label>
              <label className="field"><span>GOOGLE_REFRESH_TOKEN {editing && <em className="text-secondary">(leave blank to keep)</em>}</span>
                <input className="input" type="password" value={form.gmail.refreshToken}
                  onChange={(e) => setForm({ ...form, gmail: { ...form.gmail, refreshToken: e.target.value } })} />
              </label>
              <label className="field"><span>GOOGLE_ACCESS_TOKEN <em className="text-secondary">(optional)</em></span>
                <input className="input" type="password" value={form.gmail.accessToken}
                  onChange={(e) => setForm({ ...form, gmail: { ...form.gmail, accessToken: e.target.value } })} />
              </label>
            </fieldset>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
            <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <input type="checkbox" checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <span>Active</span>
            </label>
            <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <input type="checkbox" checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
              <span>Use as default</span>
            </label>
          </div>

          {error && <p style={{ color: 'crimson', marginTop: '0.5rem' }}>{error}</p>}
          {message && <p style={{ color: 'green', marginTop: '0.5rem' }}>{message}</p>}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn--primary" type="submit" disabled={pending}>
              {editing ? 'Save changes' : 'Create account'}
            </button>
            {editing && (
              <button className="btn btn--ghost" type="button" onClick={resetForm}>Cancel</button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
