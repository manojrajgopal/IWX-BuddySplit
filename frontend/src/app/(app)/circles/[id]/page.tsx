import { apiServer } from '@/lib/api/server';
import { formatMoney } from '@/lib/money/format';

interface Expense { id: string; amount: string; currency: string }
interface Member { userId: string; displayName: string }
interface BalanceSummary {
  currency: string;
  nets: Array<{ userId: string; displayName: string; net: string }>;
  suggested: unknown[];
}

export default async function WorkspaceOverviewPage({ params }: { params: Promise<{ id: string }> }): Promise<JSX.Element> {
  const { id } = await params;
  const [expenses, members, settlements] = await Promise.all([
    apiServer<Expense[]>(`/v1/workspaces/${id}/expenses`, { revalidate: false, throwOnError: false }) ?? [],
    apiServer<Member[]>(`/v1/workspaces/${id}/members`, { revalidate: false, throwOnError: false }) ?? [],
    apiServer<BalanceSummary>(`/v1/workspaces/${id}/settlements/summary`, { revalidate: false, throwOnError: false }),
  ]);
  const expenseList = expenses ?? [] as Expense[];
  const memberList = members ?? [] as Member[];
  const balances = settlements?.nets ?? [];
  const currency = settlements?.currency ?? 'INR';

  const totalSpend = expenseList.reduce((sum, e) => sum + BigInt(e.amount || '0'), 0n).toString();

  return (
    <div>
      <div className="feature-grid" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="text-uppercase-label">Total spend</div>
          <h2 style={{ marginTop: '0.5rem' }}>{formatMoney(totalSpend, currency)}</h2>
        </div>
        <div className="card">
          <div className="text-uppercase-label">Expenses</div>
          <h2 style={{ marginTop: '0.5rem' }}>{expenseList.length}</h2>
        </div>
        <div className="card">
          <div className="text-uppercase-label">Members</div>
          <h2 style={{ marginTop: '0.5rem' }}>{memberList.length}</h2>
        </div>
      </div>

      <h3 className="card__title" style={{ marginBottom: '1rem' }}>Balances</h3>
      {balances.length === 0 ? (
        <div className="empty-state">No balances yet.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>Member</th><th style={{ textAlign: 'right' }}>Net</th></tr></thead>
            <tbody>
              {balances.map((b) => {
                const positive = BigInt(b.net) >= 0n;
                return (
                  <tr key={b.userId}>
                    <td>{b.displayName}</td>
                    <td className={'text-mono ' + (positive ? 'text-positive' : 'text-negative')} style={{ textAlign: 'right' }}>
                      {formatMoney(b.net, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
