'use client';
import { useState } from 'react';
import { formatMoney } from '@/lib/money/format';
import { ExpenseDetailModal } from './ExpenseDetailModal';

interface Expense {
  id: string;
  description: string;
  totalMinor: string;
  currency: string;
  payerMemberId: string;
  splitMode: string;
  occurredAt: string;
}

interface Props {
  workspaceId: string;
  expenses: Expense[];
  nameMap: Record<string, string>;
}

export function ExpenseTable({ workspaceId, expenses, nameMap }: Props): JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Description</th><th>Payer</th><th>Mode</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="table__row--link" onClick={() => setSelectedId(e.id)} style={{ cursor: 'pointer' }}>
                <td className="text-secondary">{new Date(e.occurredAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                <td>{e.description}</td>
                <td>{nameMap[e.payerMemberId] || '—'}</td>
                <td><span className="pill">{e.splitMode}</span></td>
                <td className="text-mono" style={{ textAlign: 'right' }}>{formatMoney(e.totalMinor, e.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ExpenseDetailModal workspaceId={workspaceId} expenseId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}
