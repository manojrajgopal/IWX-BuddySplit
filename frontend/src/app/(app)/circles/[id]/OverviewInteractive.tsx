'use client';

import Link from 'next/link';
import { FloatingDetail } from './FloatingDetail';
import { formatMoney } from '@/lib/money/format';

interface BalanceEntry {
  memberId: string;
  paid: string;
  owed: string;
  net: string;
}

interface Transfer {
  from: string;
  to: string;
  amount: string;
}

interface OverviewInteractiveProps {
  workspaceId: string;
  expenseCount: number;
  memberCount: number;
  totalSpend: string;
  currency: string;
  balances: BalanceEntry[];
  transfers: Transfer[];
  nameMap: Record<string, string>;
}

export function OverviewInteractive({
  workspaceId,
  expenseCount,
  memberCount,
  totalSpend,
  currency,
  balances,
  transfers,
  nameMap,
}: OverviewInteractiveProps) {
  const getName = (id: string) => nameMap[id] || id;

  return (
    <div>
      {/* Summary cards */}
      <div className="feature-grid" style={{ marginBottom: '2rem' }}>
        <FloatingDetail
          detail={
            <div>
              <p className="fd-title">Total Spend Breakdown</p>
              <div className="fd-row"><span className="fd-label">Total</span><span className="fd-value">{formatMoney(totalSpend, currency)}</span></div>
              <div className="fd-row"><span className="fd-label">Expenses</span><span className="fd-value">{expenseCount}</span></div>
              <div className="fd-row"><span className="fd-label">Avg per expense</span><span className="fd-value">{expenseCount > 0 ? formatMoney((BigInt(totalSpend) / BigInt(expenseCount)).toString(), currency) : '—'}</span></div>
              <div className="fd-row"><span className="fd-label">Per member</span><span className="fd-value">{memberCount > 0 ? formatMoney((BigInt(totalSpend) / BigInt(memberCount)).toString(), currency) : '—'}</span></div>
            </div>
          }
        >
          <div className="card">
            <div className="text-uppercase-label">Total spend</div>
            <h2 style={{ marginTop: '0.5rem' }}>{formatMoney(totalSpend, currency)}</h2>
          </div>
        </FloatingDetail>

        <Link href={`/circles/${workspaceId}/expenses`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <FloatingDetail
            detail={
              <div>
                <p className="fd-title">Expenses</p>
                <div className="fd-row"><span className="fd-label">Count</span><span className="fd-value">{expenseCount}</span></div>
                <div className="fd-row"><span className="fd-label">Total value</span><span className="fd-value">{formatMoney(totalSpend, currency)}</span></div>
                <p className="fd-note">Click to view all expenses.</p>
              </div>
            }
          >
            <div className="card card--hover">
              <div className="text-uppercase-label">Expenses</div>
              <h2 style={{ marginTop: '0.5rem' }}>{expenseCount}</h2>
            </div>
          </FloatingDetail>
        </Link>

        <Link href={`/circles/${workspaceId}/members`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <FloatingDetail
            detail={
              <div>
                <p className="fd-title">Members</p>
                <div className="fd-row"><span className="fd-label">Active members</span><span className="fd-value">{memberCount}</span></div>
                <div className="fd-row"><span className="fd-label">Avg spend per member</span><span className="fd-value">{memberCount > 0 ? formatMoney((BigInt(totalSpend) / BigInt(memberCount)).toString(), currency) : '—'}</span></div>
                <p className="fd-note">Click to view all members.</p>
              </div>
            }
          >
            <div className="card card--hover">
              <div className="text-uppercase-label">Members</div>
              <h2 style={{ marginTop: '0.5rem' }}>{memberCount}</h2>
            </div>
          </FloatingDetail>
        </Link>
      </div>

      {/* Net balances table */}
      <h3 className="card__title" style={{ marginBottom: '1rem' }}>Net balances</h3>
      {balances.length === 0 ? (
        <div className="empty-state">No balances yet.</div>
      ) : (
        <div className="card" style={{ padding: 0, marginBottom: '2rem' }}>
          <table className="table">
            <thead>
              <tr><th>Member</th><th style={{ textAlign: 'right' }}>Paid</th><th style={{ textAlign: 'right' }}>Owed</th><th style={{ textAlign: 'right' }}>Net</th></tr>
            </thead>
            <tbody>
              {balances.map((b) => {
                const net = BigInt(b.net);
                const paid = BigInt(b.paid);
                const owed = BigInt(b.owed);
                const sharePercent = BigInt(totalSpend) > 0n
                  ? ((owed * 100n) / BigInt(totalSpend)).toString()
                  : '0';

                return (
                  <FloatingDetail
                    key={b.memberId}
                    as="tr"
                    detail={
                      <div>
                        <p className="fd-title">{getName(b.memberId)}</p>
                        <div className="fd-row"><span className="fd-label">Total paid</span><span className="fd-value">{formatMoney(b.paid, currency)}</span></div>
                        <div className="fd-row"><span className="fd-label">Fair share owed</span><span className="fd-value">{formatMoney(b.owed, currency)}</span></div>
                        <div className="fd-row"><span className="fd-label">Net balance</span><span className={'fd-value ' + (net >= 0n ? 'text-positive' : 'text-negative')}>{net > 0n ? '+' : ''}{formatMoney(b.net, currency)}</span></div>
                        <div className="fd-row"><span className="fd-label">Share of total</span><span className="fd-value">{sharePercent}%</span></div>
                        <p className="fd-note">
                          {net > 0n
                            ? `${getName(b.memberId)} is owed money — they paid more than their share.`
                            : net < 0n
                            ? `${getName(b.memberId)} owes money — they paid less than their share.`
                            : `${getName(b.memberId)} is fully settled.`}
                        </p>
                      </div>
                    }
                  >
                    <td>{getName(b.memberId)}</td>
                    <td className="text-mono" style={{ textAlign: 'right' }}>{formatMoney(b.paid, currency)}</td>
                    <td className="text-mono" style={{ textAlign: 'right' }}>{formatMoney(b.owed, currency)}</td>
                    <td className={'text-mono ' + (net >= 0n ? 'text-positive' : 'text-negative')} style={{ textAlign: 'right' }}>
                      {net > 0n ? '+' : ''}{formatMoney(b.net, currency)}
                    </td>
                  </FloatingDetail>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Suggested transfers table */}
      <h3 className="card__title" style={{ marginBottom: '1rem' }}>Suggested transfers</h3>
      {transfers.length === 0 ? (
        <div className="empty-state">No transfers needed — everyone is settled up!</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr><th>From</th><th>To</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
            </thead>
            <tbody>
              {transfers.map((t, i) => {
                const fromName = getName(t.from);
                const toName = getName(t.to);
                return (
                  <FloatingDetail
                    key={i}
                    as="tr"
                    detail={
                      <div>
                        <p className="fd-title">Transfer Details</p>
                        <div className="fd-row"><span className="fd-label">From</span><span className="fd-value">{fromName}</span></div>
                        <div className="fd-row"><span className="fd-label">To</span><span className="fd-value">{toName}</span></div>
                        <div className="fd-row"><span className="fd-label">Amount</span><span className="fd-value">{formatMoney(t.amount, currency)}</span></div>
                        <p className="fd-note">
                          {fromName} should pay {formatMoney(t.amount, currency)} to {toName} to settle debts.
                        </p>
                      </div>
                    }
                  >
                    <td>{fromName}</td>
                    <td>{toName}</td>
                    <td className="text-mono" style={{ textAlign: 'right' }}>{formatMoney(t.amount, currency)}</td>
                  </FloatingDetail>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
