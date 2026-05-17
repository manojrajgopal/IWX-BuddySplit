'use client';
import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { formatMoney } from '@/lib/money/format';

interface Split {
  memberId: string;
  memberName: string;
  shareMinor: string;
}

interface ExpenseDetail {
  id: string;
  description: string;
  totalMinor: string;
  currency: string;
  splitMode: string;
  splitConfig: Record<string, unknown>;
  category: string | null;
  notes: string | null;
  occurredAt: string;
  createdAt: string;
  payerMemberId: string;
  payerName: string;
  createdByName: string;
  splits: Split[];
}

interface Props {
  workspaceId: string;
  expenseId: string | null;
  onClose: () => void;
}

export function ExpenseDetailModal({ workspaceId, expenseId, onClose }: Props): JSX.Element | null {
  const [data, setData] = useState<ExpenseDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!expenseId) { setData(null); return; }
    setLoading(true);
    apiClient<ExpenseDetail>(`/v1/workspaces/${workspaceId}/expenses/${expenseId}`)
      .then(d => setData(d ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [workspaceId, expenseId]);

  const onOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  useEffect(() => {
    if (!expenseId) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [expenseId, onClose]);

  if (!expenseId) return null;

  return (
    <div className="modal-overlay" onClick={onOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal__header">
          <h3 className="modal__title">Expense Details</h3>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        {loading ? (
          <div className="modal__body" style={{ textAlign: 'center', padding: '3rem' }}>
            <span className="text-muted">Loading…</span>
          </div>
        ) : !data ? (
          <div className="modal__body" style={{ textAlign: 'center', padding: '3rem' }}>
            <span className="text-muted">Failed to load expense.</span>
          </div>
        ) : (
          <>
            <div className="modal__body">
              {/* Header section */}
              <div className="expense-detail__hero">
                <span className="expense-detail__amount text-mono">{formatMoney(data.totalMinor, data.currency)}</span>
                <span className="pill">{data.splitMode}</span>
              </div>

              <h4 className="expense-detail__desc">{data.description}</h4>

              {/* Meta grid */}
              <div className="expense-detail__meta">
                <div className="expense-detail__meta-item">
                  <span className="expense-detail__meta-label">Paid by</span>
                  <span className="expense-detail__meta-value">{data.payerName}</span>
                </div>
                <div className="expense-detail__meta-item">
                  <span className="expense-detail__meta-label">Date</span>
                  <span className="expense-detail__meta-value">{new Date(data.occurredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                {data.category && (
                  <div className="expense-detail__meta-item">
                    <span className="expense-detail__meta-label">Category</span>
                    <span className="expense-detail__meta-value">{data.category}</span>
                  </div>
                )}
                <div className="expense-detail__meta-item">
                  <span className="expense-detail__meta-label">Created by</span>
                  <span className="expense-detail__meta-value">{data.createdByName || '—'}</span>
                </div>
                <div className="expense-detail__meta-item">
                  <span className="expense-detail__meta-label">Created at</span>
                  <span className="expense-detail__meta-value">{new Date(data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {data.notes && (
                <div className="expense-detail__notes">
                  <span className="expense-detail__meta-label">Notes</span>
                  <p>{data.notes}</p>
                </div>
              )}

              {/* Split breakdown */}
              <div className="expense-detail__splits">
                <span className="expense-detail__meta-label">Split breakdown</span>
                <div className="card" style={{ padding: 0, marginTop: '0.5rem' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th style={{ textAlign: 'right' }}>Share</th>
                        <th style={{ textAlign: 'right' }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.splits.map(s => {
                        const total = BigInt(data.totalMinor);
                        const share = BigInt(s.shareMinor);
                        const pct = total > 0n ? Number((share * 10000n) / total) / 100 : 0;
                        return (
                          <tr key={s.memberId}>
                            <td>
                              {s.memberName}
                              {s.memberId === data.payerMemberId && <span className="pill pill--sm" style={{ marginLeft: '0.5rem' }}>Payer</span>}
                            </td>
                            <td className="text-mono" style={{ textAlign: 'right' }}>{formatMoney(s.shareMinor, data.currency)}</td>
                            <td className="text-mono text-muted" style={{ textAlign: 'right' }}>{pct.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>


            </div>
          </>
        )}
      </div>
    </div>
  );
}
