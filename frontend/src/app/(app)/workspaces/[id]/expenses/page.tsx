import Link from 'next/link';
import { apiServer } from '@/lib/api/server';
import { formatMoney } from '@/lib/money/format';

interface Expense {
  id: string;
  description: string;
  amount: string;
  currency: string;
  payerName: string;
  splitMode: string;
  occurredAt: string;
}

export default async function ExpensesPage({ params }: { params: { id: string } }): Promise<JSX.Element> {
  const list = await apiServer<Expense[]>(`/v1/workspaces/${params.id}/expenses`, { revalidate: false, throwOnError: false })
    .catch(() => [] as Expense[]);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0 }}>Expenses</h2>
        <Link href={`/workspaces/${params.id}/expenses/new`} className="btn btn--primary">Add expense</Link>
      </div>
      {list.length === 0 ? (
        <div className="empty-state">No expenses yet.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>Date</th><th>Description</th><th>Payer</th><th>Mode</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id}>
                  <td className="text-secondary">{new Date(e.occurredAt).toLocaleDateString()}</td>
                  <td>{e.description}</td>
                  <td>{e.payerName}</td>
                  <td><span className="pill">{e.splitMode}</span></td>
                  <td className="text-mono" style={{ textAlign: 'right' }}>{formatMoney(e.amount, e.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
