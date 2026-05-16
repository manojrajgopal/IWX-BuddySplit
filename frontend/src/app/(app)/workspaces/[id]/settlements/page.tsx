import { apiServer } from '@/lib/api/server';
import { formatMoney } from '@/lib/money/format';
import { SettlementActions } from './SettlementActions';

interface Settlement {
  id: string; debtorName: string; creditorName: string;
  amount: string; paidAmount: string; currency: string; status: string;
}
interface Summary {
  currency: string;
  nets: Array<{ userId: string; displayName: string; net: string }>;
  suggested: Settlement[];
}

export default async function SettlementsPage({ params }: { params: { id: string } }): Promise<JSX.Element> {
  const data = await apiServer<Summary>(`/v1/workspaces/${params.id}/settlements/summary`, { revalidate: false, throwOnError: false })
    .catch(() => ({ currency: 'INR', nets: [], suggested: [] } as Summary));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Settlements</h2>
        <SettlementActions workspaceId={params.id} />
      </div>

      <h3 className="card__title" style={{ marginBottom: '1rem' }}>Net balances</h3>
      {data.nets.length === 0 ? (
        <div className="empty-state">Everyone is settled.</div>
      ) : (
        <div className="card" style={{ padding: 0, marginBottom: '2rem' }}>
          <table className="table">
            <thead><tr><th>Member</th><th style={{ textAlign: 'right' }}>Net</th></tr></thead>
            <tbody>
              {data.nets.map(n => {
                const positive = BigInt(n.net) >= 0n;
                return (
                  <tr key={n.userId}>
                    <td>{n.displayName}</td>
                    <td className={'text-mono ' + (positive ? 'text-positive' : 'text-negative')} style={{ textAlign: 'right' }}>
                      {formatMoney(n.net, data.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="card__title" style={{ marginBottom: '1rem' }}>Suggested transfers</h3>
      {data.suggested.length === 0 ? (
        <div className="empty-state">No transfers needed.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>From</th><th>To</th><th style={{ textAlign: 'right' }}>Amount</th><th style={{ textAlign: 'right' }}>Paid</th><th>Status</th></tr></thead>
            <tbody>
              {data.suggested.map(s => (
                <tr key={s.id}>
                  <td>{s.debtorName}</td>
                  <td>{s.creditorName}</td>
                  <td className="text-mono" style={{ textAlign: 'right' }}>{formatMoney(s.amount, s.currency)}</td>
                  <td className="text-mono" style={{ textAlign: 'right' }}>{formatMoney(s.paidAmount, s.currency)}</td>
                  <td><span className={'pill pill--' + (s.status === 'completed' ? 'positive' : s.status === 'partial' ? 'warning' : '')}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
