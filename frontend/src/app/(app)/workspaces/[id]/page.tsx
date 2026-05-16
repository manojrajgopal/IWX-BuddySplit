import { apiServer } from '@/lib/api/server';
import { formatMoney } from '@/lib/money/format';

interface Balance { userId: string; displayName: string; net: string; currency: string }
interface Overview {
  totalSpend: string; currency: string;
  expenseCount: number; memberCount: number;
  balances: Balance[];
}

export default async function WorkspaceOverviewPage({ params }: { params: { id: string } }): Promise<JSX.Element> {
  const data = await apiServer<Overview>(`/v1/workspaces/${params.id}/overview`, { revalidate: false, throwOnError: false }).catch(
    () => ({ totalSpend: '0', currency: 'INR', expenseCount: 0, memberCount: 0, balances: [] } as Overview),
  );

  return (
    <div>
      <div className="feature-grid" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="text-uppercase-label">Total spend</div>
          <h2 style={{ marginTop: '0.5rem' }}>{formatMoney(data.totalSpend, data.currency)}</h2>
        </div>
        <div className="card">
          <div className="text-uppercase-label">Expenses</div>
          <h2 style={{ marginTop: '0.5rem' }}>{data.expenseCount}</h2>
        </div>
        <div className="card">
          <div className="text-uppercase-label">Members</div>
          <h2 style={{ marginTop: '0.5rem' }}>{data.memberCount}</h2>
        </div>
      </div>

      <h3 className="card__title" style={{ marginBottom: '1rem' }}>Balances</h3>
      {data.balances.length === 0 ? (
        <div className="empty-state">No balances yet.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>Member</th><th style={{ textAlign: 'right' }}>Net</th></tr></thead>
            <tbody>
              {data.balances.map((b) => {
                const positive = BigInt(b.net) >= 0n;
                return (
                  <tr key={b.userId}>
                    <td>{b.displayName}</td>
                    <td className={'text-mono ' + (positive ? 'text-positive' : 'text-negative')} style={{ textAlign: 'right' }}>
                      {formatMoney(b.net, b.currency)}
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
