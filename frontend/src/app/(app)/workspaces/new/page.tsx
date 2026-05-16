'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

const COMMON_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

export default function NewWorkspacePage(): JSX.Element {
  const router = useRouter();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [kind, setKind] = useState<'trip' | 'household' | 'event' | 'other'>('trip');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault(); setError(null); setBusy(true);
    try {
      const ws = await apiClient<{ id: string }>('/v1/workspaces', { method: 'POST', body: { name, currency, kind } });
      router.push(`/workspaces/${ws.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally { setBusy(false); }
  }

  return (
    <div style={{ padding: '2rem var(--container-pad)', maxWidth: 540, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>New workspace</h1>
      <form onSubmit={onSubmit} className="card">
        <div className="field"><label className="label">Name</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field"><label className="label">Kind</label>
          <select className="select" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
            <option value="trip">Trip</option><option value="household">Household</option>
            <option value="event">Event</option><option value="other">Other</option>
          </select>
        </div>
        <div className="field"><label className="label">Currency</label>
          <select className="select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {COMMON_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {error && <div className="field__error">{error}</div>}
        <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create workspace'}</button>
      </form>
    </div>
  );
}
