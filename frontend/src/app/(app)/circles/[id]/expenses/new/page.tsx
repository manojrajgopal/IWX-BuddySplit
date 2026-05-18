import { apiServer } from '@/lib/api/server';
import { ExpenseForm } from './ExpenseForm';
import { formatMoney } from '@/lib/money/format';

interface ApiMember {
  id: string;
  userId: string;
  user: { displayName: string };
}
interface Workspace { id: string; baseCurrency: string; name: string }
interface Expense { id: string; totalMinor: string; currency: string; description: string; occurredAt: string }

export default async function NewExpensePage({ params }: { params: Promise<{ id: string }> }): Promise<JSX.Element> {
  const { id } = await params;
  const [ws, rawMembers, recentExpenses] = await Promise.all([
    apiServer<Workspace>(`/v1/workspaces/${id}`, { revalidate: false }),
    apiServer<ApiMember[]>(`/v1/workspaces/${id}/members`, { revalidate: false, throwOnError: false }).catch(() => null) ?? [] as ApiMember[],
    apiServer<Expense[]>(`/v1/workspaces/${id}/expenses`, { revalidate: false, throwOnError: false }).catch(() => null),
  ]);
  const members = (rawMembers ?? []).map(m => ({ memberId: m.id, displayName: m.user?.displayName ?? '' }));
  const expenses = (recentExpenses ?? []).slice(0, 5);
  const totalSpend = expenses.reduce((s, e) => s + BigInt(e.totalMinor || '0'), 0n).toString();

  return (
    <div className="expense-page-layout">
      <div className="expense-page-layout__form">
        <h2 style={{ marginBottom: '1.5rem' }}>Add expense</h2>
        <ExpenseForm workspaceId={ws.id} currency={ws.baseCurrency} members={members} />
      </div>
      <aside className="expense-page-layout__sidebar">
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card__title" style={{ marginBottom: '0.75rem' }}>Quick info</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Circle</span>
              <span style={{ fontWeight: 600 }}>{ws.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Currency</span>
              <span className="text-mono">{ws.baseCurrency}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Members</span>
              <span>{members.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Total spent</span>
              <span className="text-mono">{formatMoney(totalSpend, ws.baseCurrency)}</span>
            </div>
          </div>
        </div>

        {expenses.length > 0 && (
          <div className="card">
            <div className="card__title" style={{ marginBottom: '0.75rem' }}>Recent expenses</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {expenses.map((e) => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{e.description || 'Untitled'}</span>
                  <span className="text-mono" style={{ flexShrink: 0 }}>{formatMoney(e.totalMinor, e.currency)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="card__title" style={{ marginBottom: '0.5rem' }}>Tips</div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <li>Use &quot;Equal&quot; for quick even splits.</li>
            <li>For restaurant bills, try &quot;Itemized&quot; to assign dishes.</li>
            <li>Use &quot;Adjustment&quot; when someone had extras on an otherwise equal split.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
