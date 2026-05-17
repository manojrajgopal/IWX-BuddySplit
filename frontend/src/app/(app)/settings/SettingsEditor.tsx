'use client';
import { useState } from 'react';

interface Props {
  initialSettings: Record<string, unknown>;
}

function display(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function SettingsEditor({ initialSettings }: Props): JSX.Element {
  const [settings, setSettings] = useState(initialSettings);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(key: string) {
    setEditing(key);
    setDraft(display(settings[key]));
    setError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setDraft('');
    setError(null);
  }

  async function saveEdit(key: string) {
    setBusy(true);
    setError(null);
    let parsed: unknown = draft;
    try { parsed = JSON.parse(draft); } catch { /* keep as string */ }
    try {
      const res = await fetch(`/api/backend/v1/settings/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value: parsed }),
        credentials: 'include',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`);
      }
      setSettings((prev) => ({ ...prev, [key]: parsed }));
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  const entries = Object.entries(settings);

  if (entries.length === 0) {
    return <div className="empty-state"><p>No settings configured yet.</p></div>;
  }

  return (
    <>
      {error && <div className="field__error" role="alert" style={{ marginBottom: '1rem' }}>{error}</div>}
      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-border, #e5e7eb)', color: 'var(--color-text-secondary, #6b7280)', fontWeight: 500, width: '30%' }}>Key</th>
              <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-border, #e5e7eb)', color: 'var(--color-text-secondary, #6b7280)', fontWeight: 500 }}>Value</th>
              <th style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-border, #e5e7eb)', width: '100px' }} />
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, value]) => (
              <tr key={key}>
                <td style={{ padding: '0.625rem 0.75rem', borderBottom: '1px solid var(--color-border, #e5e7eb)', fontFamily: 'monospace', fontSize: '0.85rem', verticalAlign: 'middle' }}>{key}</td>
                <td style={{ padding: '0.625rem 0.75rem', borderBottom: '1px solid var(--color-border, #e5e7eb)', verticalAlign: 'middle' }}>
                  {editing === key ? (
                    <input
                      className="input"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      style={{ width: '100%', fontFamily: typeof value === 'object' ? 'monospace' : undefined, fontSize: '0.85rem' }}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(key); if (e.key === 'Escape') cancelEdit(); }}
                    />
                  ) : (
                    <span style={{ fontFamily: typeof value === 'object' ? 'monospace' : undefined, fontSize: typeof value === 'object' ? '0.8rem' : undefined, color: value === null || value === '' ? 'var(--color-text-secondary, #6b7280)' : undefined }}>
                      {display(value) || <em style={{ opacity: 0.5 }}>empty</em>}
                    </span>
                  )}
                </td>
                <td style={{ padding: '0.625rem 0.75rem', borderBottom: '1px solid var(--color-border, #e5e7eb)', textAlign: 'right', verticalAlign: 'middle' }}>
                  {editing === key ? (
                    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn--primary btn--sm" onClick={() => saveEdit(key)} disabled={busy}>{busy ? '…' : 'Save'}</button>
                      <button className="btn btn--ghost btn--sm" onClick={cancelEdit} disabled={busy}>Cancel</button>
                    </div>
                  ) : (
                    <button className="btn btn--outline btn--sm" onClick={() => startEdit(key)}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
