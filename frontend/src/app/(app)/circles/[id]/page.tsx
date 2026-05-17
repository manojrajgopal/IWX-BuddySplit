import { apiServer } from '@/lib/api/server';
import { formatMoney } from '@/lib/money/format';

interface Expense { id: string; totalMinor: string; currency: string }
interface Member { id: string; user: { displayName: string } }
interface BalanceSummary {
  currency: string;
  members: Array<{ memberId: string; paid: string; owed: string; net: string }>;
  transfers: Array<{ from: string; to: string; amount: string }>;
}

export default async function WorkspaceOverviewPage({ params }: { params: Promise<{ id: string }> }): Promise<JSX.Element> {
  const { id } = await params;
  const [expenses, members, settlements] = await Promise.all([
    apiServer<Expense[]>(`/v1/workspaces/${id}/expenses`, { revalidate: false, throwOnError: false }).catch(() => null),
    apiServer<Member[]>(`/v1/workspaces/${id}/members`, { revalidate: false, throwOnError: false }).catch(() => null),
    apiServer<BalanceSummary>(`/v1/workspaces/${id}/settlements/summary`, { revalidate: false, throwOnError: false }).catch(() => null),
  ]);
  const expenseList = expenses ?? [];
  const memberList = members ?? [];
  const balances = settlements?.members ?? [];
  const transfers = settlements?.transfers ?? [];
  const currency = settlements?.currency ?? 'INR';
  const nameMap = new Map(memberList.map((m) => [m.id, m.user?.displayName ?? '']));

  const totalSpend = expenseList.reduce((sum, e) => sum + BigInt(e.totalMinor || '0'), 0n).toString();

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

      <h3 className="card__title" style={{ marginBottom: '1rem' }}>Net balances</h3>
      {balances.length === 0 ? (
        <div className="empty-state">No balances yet.</div>
      ) : (
        <div className="card" style={{ padding: 0, marginBottom: '2rem' }}>
          <table className="table">
            <thead><tr><th>Member</th><th style={{ textAlign: 'right' }}>Paid</th><th style={{ textAlign: 'right' }}>Owed</th><th style={{ textAlign: 'right' }}>Net</th></tr></thead>
            <tbody>
              {balances.map((b) => {
                const net = BigInt(b.net);
                return (
                  <tr key={b.memberId}>
                    <td>{nameMap.get(b.memberId) || b.memberId}</td>
                    <td className="text-mono" style={{ textAlign: 'right' }}>{formatMoney(b.paid, currency)}</td>
                    <td className="text-mono" style={{ textAlign: 'right' }}>{formatMoney(b.owed, currency)}</td>
                    <td className={'text-mono ' + (net >= 0n ? 'text-positive' : 'text-negative')} style={{ textAlign: 'right' }}>
                      {net > 0n ? '+' : ''}{formatMoney(b.net, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="card__title" style={{ marginBottom: '1rem' }}>Suggested transfers</h3>
      {transfers.length === 0 ? (
        <div className="empty-state">No transfers needed — everyone is settled up!</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>From</th><th>To</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
            <tbody>
              {transfers.map((t, i) => (
                <tr key={i}>
                  <td>{nameMap.get(t.from) || t.from}</td>
                  <td>{nameMap.get(t.to) || t.to}</td>
                  <td className="text-mono" style={{ textAlign: 'right' }}>{formatMoney(t.amount, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
