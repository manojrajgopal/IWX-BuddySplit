'use client';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { parseDecimalToMinor, minorDigits } from '@/lib/money/format';
import { SplitModeGuide } from './SplitModeGuide';

interface Member { memberId: string; displayName: string }
type SplitMode = 'equal' | 'exact' | 'percentage' | 'shares' | 'adjustment' | 'itemized';

interface Props { workspaceId: string; currency: string; members: Member[] }

export function ExpenseForm({ workspaceId, currency, members }: Props): JSX.Element {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState(members[0]?.memberId ?? '');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [participants, setParticipants] = useState<Set<string>>(new Set(members.map(m => m.memberId)));
  // Per-mode inputs keyed by memberId.
  const [exact, setExact] = useState<Record<string, string>>({});
  const [percent, setPercent] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, string>>({});
  const [adjustments, setAdjustments] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const digits = minorDigits(currency);
  const visibleMembers = useMemo(() => members.filter(m => participants.has(m.memberId)), [members, participants]);

  function toggle(memberId: string): void {
    const next = new Set(participants);
    if (next.has(memberId)) next.delete(memberId); else next.add(memberId);
    setParticipants(next);
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const amountMinor = parseDecimalToMinor(amount, currency).toString();
      const participantMemberIds = visibleMembers.map(m => m.memberId);
      const buildSplit = (): Record<string, unknown> => {
        switch (splitMode) {
          case 'equal':
            return {};
          case 'exact': {
            const amounts: Record<string, string> = {};
            for (const m of visibleMembers) amounts[m.memberId] = parseDecimalToMinor(exact[m.memberId] ?? '0', currency).toString();
            return { amounts };
          }
          case 'percentage': {
            const bp: Record<string, number> = {};
            for (const m of visibleMembers) bp[m.memberId] = Math.round(parseFloat(percent[m.memberId] ?? '0') * 100);
            return { bp };
          }
          case 'shares': {
            const sh: Record<string, number> = {};
            for (const m of visibleMembers) sh[m.memberId] = parseInt(shares[m.memberId] ?? '1', 10);
            return { shares: sh };
          }
          case 'adjustment': {
            const adj: Record<string, string> = {};
            for (const m of visibleMembers) adj[m.memberId] = parseDecimalToMinor(adjustments[m.memberId] ?? '0', currency).toString();
            return { adjustments: adj };
          }
          case 'itemized': {
            const lines = visibleMembers.map(m => ({ memberId: m.memberId, amount: parseDecimalToMinor(exact[m.memberId] ?? '0', currency).toString() }));
            return { lines };
          }
        }
      };

      await apiClient(`/v1/workspaces/${workspaceId}/expenses`, {
        method: 'POST',
        body: {
          description,
          amount: amountMinor,
          currency,
          payerMemberId: payerId,
          splitMode,
          splitConfig: buildSplit(),
          participantMemberIds,
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
        <input className="input" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Dinner at Meghana Foods" />
      </div>

      <div className="field"><label className="label">Split mode</label>
        <select className="select" value={splitMode} onChange={(e) => setSplitMode(e.target.value as SplitMode)}>
          <option value="equal">Equal — split evenly</option>
          <option value="exact">Exact amounts — you set each person&apos;s share</option>
          <option value="percentage">Percentage — split by %</option>
          <option value="shares">Shares — split by ratio</option>
          <option value="adjustment">Equal + adjustments — equal base ± tweaks</option>
          <option value="itemized">Itemized — assign items to people</option>
        </select>
      </div>

      <SplitModeGuide activeMode={splitMode} />

      <div className="divider" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="field"><label className="label">Total amount ({currency})</label>
          <input className="input text-mono" required inputMode="decimal" placeholder={`0.${'0'.repeat(digits)}`} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="field"><label className="label">Paid by</label>
          <select className="select" value={payerId} onChange={(e) => setPayerId(e.target.value)}>
            {members.map(m => <option key={m.memberId} value={m.memberId}>{m.displayName}</option>)}
          </select>
        </div>
      </div>

      <div className="divider" />

      <div className="field">
        <label className="label">Split between</label>
        {splitMode === 'equal' && (
          <p className="field__hint">Everyone selected below pays an equal share.</p>
        )}
        {splitMode === 'exact' && (
          <p className="field__hint">Enter the exact amount each person owes. Must total {amount ? `${currency} ${amount}` : 'the expense amount'}.</p>
        )}
        {splitMode === 'percentage' && (
          <p className="field__hint">Enter each person&apos;s percentage. Must total 100%.</p>
        )}
        {splitMode === 'shares' && (
          <p className="field__hint">Assign share units (e.g. 2 shares = double the amount of 1 share).</p>
        )}
        {splitMode === 'adjustment' && (
          <p className="field__hint">Base is split equally. Add +/− adjustments for extras or discounts.</p>
        )}
        {splitMode === 'itemized' && (
          <p className="field__hint">Assign line-item amounts to each person. Must total the expense amount.</p>
        )}

        <div className="split-members">
          {members.map(m => {
            const checked = participants.has(m.memberId);
            const needsInput = checked && splitMode !== 'equal';
            return (
              <div key={m.memberId} className={'split-member' + (checked ? ' split-member--active' : '')}>
                <div className="split-member__row">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    className={'toggle' + (checked ? ' toggle--on' : '')}
                    onClick={() => toggle(m.memberId)}
                  >
                    <span className="toggle__thumb" />
                  </button>
                  <span className={'split-member__name' + (checked ? '' : ' split-member__name--off')}>{m.displayName}</span>
                  {checked && splitMode === 'equal' && amount && visibleMembers.length > 0 && (
                    <span className="split-member__preview text-mono">
                      ≈ {currency} {(parseFloat(amount) / visibleMembers.length).toFixed(digits)}
                    </span>
                  )}
                </div>
                {needsInput && (
                  <div className="split-member__input">
                    {splitMode === 'exact' && (
                      <div className="field" style={{ margin: 0 }}>
                        <label className="label label--sm">Amount ({currency})</label>
                        <input className="input input--sm text-mono" inputMode="decimal" placeholder={`0.${'0'.repeat(digits)}`} value={exact[m.memberId] ?? ''} onChange={(e) => setExact({ ...exact, [m.memberId]: e.target.value })} />
                      </div>
                    )}
                    {splitMode === 'percentage' && (
                      <div className="field" style={{ margin: 0 }}>
                        <label className="label label--sm">Percentage</label>
                        <div style={{ position: 'relative' }}>
                          <input className="input input--sm text-mono" inputMode="decimal" placeholder="0" value={percent[m.memberId] ?? ''} onChange={(e) => setPercent({ ...percent, [m.memberId]: e.target.value })} style={{ paddingRight: '2rem' }} />
                          <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>%</span>
                        </div>
                      </div>
                    )}
                    {splitMode === 'shares' && (
                      <div className="field" style={{ margin: 0 }}>
                        <label className="label label--sm">Shares</label>
                        <input className="input input--sm text-mono" inputMode="numeric" placeholder="1" value={shares[m.memberId] ?? ''} onChange={(e) => setShares({ ...shares, [m.memberId]: e.target.value })} />
                      </div>
                    )}
                    {splitMode === 'adjustment' && (
                      <div className="field" style={{ margin: 0 }}>
                        <label className="label label--sm">Adjustment ({currency})</label>
                        <input className="input input--sm text-mono" inputMode="decimal" placeholder="±0.00" value={adjustments[m.memberId] ?? ''} onChange={(e) => setAdjustments({ ...adjustments, [m.memberId]: e.target.value })} />
                      </div>
                    )}
                    {splitMode === 'itemized' && (
                      <div className="field" style={{ margin: 0 }}>
                        <label className="label label--sm">Item total ({currency})</label>
                        <input className="input input--sm text-mono" inputMode="decimal" placeholder={`0.${'0'.repeat(digits)}`} value={exact[m.memberId] ?? ''} onChange={(e) => setExact({ ...exact, [m.memberId]: e.target.value })} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Running totals */}
        {splitMode === 'exact' && visibleMembers.length > 0 && (
          <div className="split-summary">
            <span>Sum of amounts:</span>
            <span className="text-mono">{currency} {visibleMembers.reduce((s, m) => s + parseFloat(exact[m.memberId] || '0'), 0).toFixed(digits)}</span>
            <span className="text-muted">/ {amount || '0'}</span>
          </div>
        )}
        {splitMode === 'percentage' && visibleMembers.length > 0 && (
          <div className="split-summary">
            <span>Total percentage:</span>
            <span className="text-mono">{visibleMembers.reduce((s, m) => s + parseFloat(percent[m.memberId] || '0'), 0).toFixed(2)}%</span>
            <span className="text-muted">/ 100%</span>
          </div>
        )}
        {splitMode === 'shares' && visibleMembers.length > 0 && (
          <div className="split-summary">
            <span>Total shares:</span>
            <span className="text-mono">{visibleMembers.reduce((s, m) => s + parseInt(shares[m.memberId] || '1', 10), 0)}</span>
          </div>
        )}
      </div>

      {error && <div className="field__error">{error}</div>}
      <button className="btn btn--primary" type="submit" disabled={busy || !payerId || participants.size === 0}>
        {busy ? 'Saving…' : 'Add expense'}
      </button>
    </form>
  );
}
