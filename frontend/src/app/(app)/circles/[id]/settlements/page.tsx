import { apiServer } from '@/lib/api/server';
import { formatMoney } from '@/lib/money/format';
import { SettlementActions } from './SettlementActions';

interface BalanceSummary {
  currency: string;
  members: Array<{ memberId: string; paid: string; owed: string; net: string }>;
  transfers: Array<{ from: string; to: string; amount: string }>;
}
interface ApiMember { id: string; userId: string; user: { displayName: string } }

const EMPTY: BalanceSummary = { currency: 'INR', members: [], transfers: [] };

export default async function SettlementsPage({ params }: { params: Promise<{ id: string }> }): Promise<JSX.Element> {
  const { id } = await params;
  const [summary, rawMembers] = await Promise.all([
    apiServer<BalanceSummary>(`/v1/workspaces/${id}/settlements/summary`, { revalidate: false, throwOnError: false }).catch(() => null),
    apiServer<ApiMember[]>(`/v1/workspaces/${id}/members`, { revalidate: false, throwOnError: false }).catch(() => null),
  ]);
  const data = summary ?? EMPTY;
  const nameMap = new Map((rawMembers ?? []).map(m => [m.id, m.user?.displayName ?? '']));
  // The summary uses memberId (from workspace_members), while members API returns userId.
  // We also need a memberId→displayName map. Members list has userId + user.displayName.
  // The settlements summary uses memberId (workspace_members.id), not userId. Build a lookup.
  // Actually the members endpoint returns objects with both, so let's adapt.

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Settlements</h2>
        <SettlementActions workspaceId={id} />
      </div>

      <h3 className="card__title" style={{ marginBottom: '1rem' }}>Net balances</h3>
      {data.members.length === 0 ? (
        <div className="empty-state">Everyone is settled.</div>
      ) : (
        <div className="card" style={{ padding: 0, marginBottom: '2rem' }}>
          <table className="table">
            <thead><tr><th>Member</th><th style={{ textAlign: 'right' }}>Paid</th><th style={{ textAlign: 'right' }}>Owed</th><th style={{ textAlign: 'right' }}>Net</th></tr></thead>
            <tbody>
              {data.members.map(m => {
                const net = BigInt(m.net);
                const positive = net >= 0n;
                return (
                  <tr key={m.memberId}>
                    <td>{nameMap.get(m.memberId) || m.memberId.slice(0, 8)}</td>
                    <td className="text-mono" style={{ textAlign: 'right' }}>{formatMoney(m.paid, data.currency)}</td>
                    <td className="text-mono" style={{ textAlign: 'right' }}>{formatMoney(m.owed, data.currency)}</td>
                    <td className={'text-mono ' + (positive ? 'text-positive' : 'text-negative')} style={{ textAlign: 'right' }}>
                      {formatMoney(m.net, data.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="card__title" style={{ marginBottom: '1rem' }}>Suggested transfers</h3>
      {data.transfers.length === 0 ? (
        <div className="empty-state">No transfers needed.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>From</th><th>To</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
            <tbody>
              {data.transfers.map((t, i) => (
                <tr key={i}>
                  <td>{nameMap.get(t.from) || t.from.slice(0, 8)}</td>
                  <td>{nameMap.get(t.to) || t.to.slice(0, 8)}</td>
                  <td className="text-mono" style={{ textAlign: 'right' }}>{formatMoney(t.amount, data.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
