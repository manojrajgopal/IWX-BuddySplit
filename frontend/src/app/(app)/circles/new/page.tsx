'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

const COMMON_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'AED'];
const KINDS: Array<{ value: 'trip' | 'roommates' | 'event' | 'other'; label: string; hint: string }> = [
  { value: 'trip',      label: 'Trip',      hint: 'Weekend getaway, road trip, or vacation.' },
  { value: 'roommates', label: 'Household', hint: 'Flatmates, roommates, recurring bills.' },
  { value: 'event',     label: 'Event',     hint: 'Birthday, wedding, party, or one-off gathering.' },
  { value: 'other',     label: 'Other',     hint: 'Any group of buddies splitting any expense.' },
];

export default function NewCirclePage(): JSX.Element {
  const router = useRouter();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [kind, setKind] = useState<'trip' | 'roommates' | 'event' | 'other'>('trip');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault(); setError(null); setBusy(true);
    try {
      const ws = await apiClient<{ id: string }>('/v1/workspaces', { method: 'POST', body: { name, baseCurrency: currency, kind } });
      router.push(`/circles/${ws.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally { setBusy(false); }
  }

  return (
    <div style={{ padding: '2rem var(--container-pad)', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <Link href="/circles" className="text-secondary" style={{ fontSize: '0.85rem' }}>← Back to circles</Link>
      </div>
      <h1 style={{ marginBottom: '0.35rem' }}>Create a new circle</h1>
      <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>A circle is a group of buddies who share expenses. You can invite members right after creation.</p>
      <form onSubmit={onSubmit} className="card">
        <div className="field"><label className="label">Circle name</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Goa Trip 2026, Apartment 4B, Sam's Birthday" />
        </div>
        <div className="field"><label className="label">Kind</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
            {KINDS.map((k) => (
              <label key={k.value} className="card" style={{ padding: '0.85rem', cursor: 'pointer', borderColor: kind === k.value ? 'var(--text-primary)' : 'var(--border-color)' }}>
                <input type="radio" name="kind" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} style={{ marginRight: '0.5rem' }} />
                <strong>{k.label}</strong>
                <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>{k.hint}</div>
              </label>
            ))}
          </div>
        </div>
        <div className="field"><label className="label">Base currency</label>
          <select className="select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {COMMON_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.4rem' }}>Members can still log expenses in other currencies — they convert to this base.</div>
        </div>
        {error && <div className="field__error">{error}</div>}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button className="btn btn--primary" type="submit" disabled={busy || name.trim().length === 0}>{busy ? 'Creating…' : 'Create circle'}</button>
          <Link href="/circles" className="btn btn--ghost">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
