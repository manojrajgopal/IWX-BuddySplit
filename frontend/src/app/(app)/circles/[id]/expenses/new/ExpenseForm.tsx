'use client';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { parseDecimalToMinor, minorDigits } from '@/lib/money/format';

interface Member { userId: string; displayName: string }
type SplitMode = 'equal' | 'exact' | 'percentage' | 'shares' | 'adjustment' | 'itemized';

interface Props { workspaceId: string; currency: string; members: Member[] }

export function ExpenseForm({ workspaceId, currency, members }: Props): JSX.Element {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState(members[0]?.userId ?? '');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [participants, setParticipants] = useState<Set<string>>(new Set(members.map(m => m.userId)));
  // Per-mode inputs keyed by userId.
  const [exact, setExact] = useState<Record<string, string>>({});
  const [percent, setPercent] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, string>>({});
  const [adjustments, setAdjustments] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const digits = minorDigits(currency);
  const visibleMembers = useMemo(() => members.filter(m => participants.has(m.userId)), [members, participants]);

  function toggle(userId: string): void {
    const next = new Set(participants);
    if (next.has(userId)) next.delete(userId); else next.add(userId);
    setParticipants(next);
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const amountMinor = parseDecimalToMinor(amount, currency).toString();
      const buildSplit = (): unknown => {
        const base = visibleMembers.map(m => ({ userId: m.userId }));
        switch (splitMode) {
          case 'equal':
            return { participants: base };
          case 'exact':
            return { participants: visibleMembers.map(m => ({ userId: m.userId, amount: parseDecimalToMinor(exact[m.userId] ?? '0', currency).toString() })) };
          case 'percentage':
            return { participants: visibleMembers.map(m => ({ userId: m.userId, bp: Math.round(parseFloat(percent[m.userId] ?? '0') * 100) })) };
          case 'shares':
            return { participants: visibleMembers.map(m => ({ userId: m.userId, shares: parseInt(shares[m.userId] ?? '1', 10) })) };
          case 'adjustment':
            return { participants: visibleMembers.map(m => ({ userId: m.userId, adjustment: parseDecimalToMinor(adjustments[m.userId] ?? '0', currency).toString() })) };
          case 'itemized':
            // Simplification: treat each participant as one item of equal share for now.
            return { items: visibleMembers.map(m => ({ amount: '0', participants: [{ userId: m.userId }] })) };
        }
      };

      await apiClient(`/v1/workspaces/${workspaceId}/expenses`, {
        method: 'POST',
        body: {
          description,
          amount: amountMinor,
          currency,
          payerId,
          splitMode,
          splitConfig: buildSplit(),
        },
      });
      router.push(`/circles/${workspaceId}/expenses`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create expense');
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={onSubmit} className="card" style={{ maxWidth: 720 }}>
      <div className="field"><label className="label">Description</label>
        <input className="input" required value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="field"><label className="label">Amount ({currency})</label>
          <input className="input text-mono" required inputMode="decimal" placeholder={`0.${'0'.repeat(digits)}`} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="field"><label className="label">Paid by</label>
          <select className="select" value={payerId} onChange={(e) => setPayerId(e.target.value)}>
            {members.map(m => <option key={m.userId} value={m.userId}>{m.displayName}</option>)}
          </select>
        </div>
      </div>

      <div className="field"><label className="label">Split mode</label>
        <select className="select" value={splitMode} onChange={(e) => setSplitMode(e.target.value as SplitMode)}>
          <option value="equal">Equal</option>
          <option value="exact">Exact amounts</option>
          <option value="percentage">Percentage</option>
          <option value="shares">Shares</option>
          <option value="adjustment">Equal + adjustments</option>
          <option value="itemized">Itemized</option>
        </select>
      </div>

      <div className="divider" />

      <div className="field">
        <label className="label">Participants</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {members.map(m => {
            const checked = participants.has(m.userId);
            return (
              <div key={m.userId} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 160px', alignItems: 'center', gap: '0.75rem' }}>
                <input type="checkbox" checked={checked} onChange={() => toggle(m.userId)} />
                <span>{m.displayName}</span>
                {checked && splitMode === 'exact' && (
                  <input className="input text-mono" inputMode="decimal" placeholder="0.00" value={exact[m.userId] ?? ''} onChange={(e) => setExact({ ...exact, [m.userId]: e.target.value })} />
                )}
                {checked && splitMode === 'percentage' && (
                  <input className="input text-mono" inputMode="decimal" placeholder="%" value={percent[m.userId] ?? ''} onChange={(e) => setPercent({ ...percent, [m.userId]: e.target.value })} />
                )}
                {checked && splitMode === 'shares' && (
                  <input className="input text-mono" inputMode="numeric" placeholder="1" value={shares[m.userId] ?? ''} onChange={(e) => setShares({ ...shares, [m.userId]: e.target.value })} />
                )}
                {checked && splitMode === 'adjustment' && (
                  <input className="input text-mono" inputMode="decimal" placeholder="±0.00" value={adjustments[m.userId] ?? ''} onChange={(e) => setAdjustments({ ...adjustments, [m.userId]: e.target.value })} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && <div className="field__error">{error}</div>}
      <button className="btn btn--primary" type="submit" disabled={busy || !payerId || participants.size === 0}>
        {busy ? 'Saving…' : 'Add expense'}
      </button>
    </form>
  );
}
