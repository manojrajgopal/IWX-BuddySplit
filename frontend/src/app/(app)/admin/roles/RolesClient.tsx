'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

export interface Permission { resource: string; action: string }
export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}
export interface RoleCatalog { resources: string[]; actions: string[] }

export function RolesClient({
  initial, catalog,
}: { initial: Role[]; catalog: RoleCatalog }): JSX.Element {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
  const [draftName, setDraftName] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = useMemo(() => roles.find((r) => r.id === selectedId) ?? null, [roles, selectedId]);

  async function reload(): Promise<void> {
    const data = await apiClient<Role[]>('/v1/admin/roles').catch(() => []);
    setRoles(data ?? []);
  }

  function refresh(): void { startTransition(() => router.refresh()); }

  async function createRole(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null); setMessage(null);
    try {
      const created = await apiClient<Role>('/v1/admin/roles', {
        method: 'POST',
        body: { name: draftName.trim(), description: draftDesc.trim() || null, permissions: [] },
      });
      setDraftName(''); setDraftDesc('');
      await reload();
      setSelectedId(created.id);
      setMessage('Role created.');
      refresh();
    } catch (err) { setError((err as Error).message); }
  }

  async function removeRole(id: string): Promise<void> {
    if (!confirm('Delete this role? Users assigned to it will lose its permissions.')) return;
    try {
      await apiClient(`/v1/admin/roles/${id}`, { method: 'DELETE' });
      await reload();
      setSelectedId(null);
      refresh();
    } catch (err) { setError((err as Error).message); }
  }

  async function togglePermission(resource: string, action: string): Promise<void> {
    if (!selected) return;
    const has = selected.permissions.some((p) => p.resource === resource && p.action === action);
    const next = has
      ? selected.permissions.filter((p) => !(p.resource === resource && p.action === action))
      : [...selected.permissions, { resource, action }];
    try {
      const updated = await apiClient<Role>(`/v1/admin/roles/${selected.id}`, {
        method: 'PATCH',
        body: { permissions: next },
      });
      setRoles((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) { setError((err as Error).message); }
  }

  async function saveDescription(): Promise<void> {
    if (!selected) return;
    try {
      const updated = await apiClient<Role>(`/v1/admin/roles/${selected.id}`, {
        method: 'PATCH',
        body: { description: selected.description },
      });
      setRoles((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
      setMessage('Saved.');
    } catch (err) { setError((err as Error).message); }
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '300px minmax(0, 1fr)' }}>
      <aside className="card" style={{ alignSelf: 'start' }}>
        <h3 style={{ marginTop: 0 }}>Roles</h3>
        <div style={{ display: 'grid', gap: '0.25rem', marginBottom: '1rem' }}>
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedId(r.id)}
              className={`btn btn--ghost ${r.id === selectedId ? 'btn--primary' : ''}`}
              style={{ justifyContent: 'space-between', display: 'flex' }}
            >
              <span>{r.name}</span>
              {r.isSystem && <span className="text-uppercase-label">sys</span>}
            </button>
          ))}
        </div>

        <form onSubmit={createRole} style={{ display: 'grid', gap: '0.5rem' }}>
          <h4 style={{ margin: '0.5rem 0 0' }}>New role</h4>
          <input className="input" placeholder="role_name" value={draftName}
            onChange={(e) => setDraftName(e.target.value)} required />
          <input className="input" placeholder="Description (optional)" value={draftDesc}
            onChange={(e) => setDraftDesc(e.target.value)} />
          <button className="btn btn--primary" type="submit" disabled={pending}>Create role</button>
        </form>
      </aside>

      <section>
        {!selected && <div className="card"><p className="text-secondary">Select a role to manage its permissions.</p></div>}
        {selected && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0 }}>{selected.name}</h2>
                {selected.isSystem && <span className="text-uppercase-label">System role · cannot be deleted</span>}
              </div>
              {!selected.isSystem && (
                <button className="btn btn--ghost" style={{ color: 'crimson' }} onClick={() => removeRole(selected.id)} type="button">
                  Delete role
                </button>
              )}
            </div>

            <label className="field" style={{ marginTop: '1rem' }}>
              <span>Description</span>
              <textarea className="input" rows={2} value={selected.description ?? ''}
                onChange={(e) => setRoles((rs) => rs.map((r) =>
                  r.id === selected.id ? { ...r, description: e.target.value } : r))} />
            </label>
            <button className="btn btn--ghost btn--sm" type="button" onClick={saveDescription}>Save description</button>

            <h3 style={{ marginTop: '1.5rem' }}>Permissions</h3>
            {selected.name === 'admin' && (
              <p className="text-secondary">The <code>admin</code> role implicitly grants every permission.</p>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Resource</th>
                    {catalog.actions.map((a) => (
                      <th key={a} style={{ padding: '0.5rem', textTransform: 'capitalize' }}>{a}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catalog.resources.map((res) => (
                    <tr key={res} style={{ borderTop: '1px solid var(--color-border, #e5e7eb)' }}>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{res}</td>
                      {catalog.actions.map((act) => {
                        const checked = selected.permissions.some((p) =>
                          (p.resource === res || p.resource === '*') &&
                          (p.action === act || p.action === '*'));
                        const disabled = selected.name === 'admin';
                        return (
                          <td key={act} style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <input type="checkbox" checked={checked} disabled={disabled}
                              onChange={() => togglePermission(res, act)} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && <p style={{ color: 'crimson' }}>{error}</p>}
            {message && <p style={{ color: 'green' }}>{message}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
