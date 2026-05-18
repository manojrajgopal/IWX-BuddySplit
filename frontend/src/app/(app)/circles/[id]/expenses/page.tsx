import Link from 'next/link';
import { apiServer } from '@/lib/api/server';
import { ExpenseTable } from './ExpenseTable';
import { formatMoney } from '@/lib/money/format';

interface Expense {
  id: string;
  description: string;
  totalMinor: string;
  currency: string;
  payerMemberId: string;
  splitMode: string;
  occurredAt: string;
}

interface Member {
  id: string;
  user: { displayName: string };
}

export default async function ExpensesPage({ params }: { params: Promise<{ id: string }> }): Promise<JSX.Element> {
  const { id } = await params;
  const [listRaw, membersRaw] = await Promise.all([
    apiServer<Expense[]>(`/v1/workspaces/${id}/expenses`, { revalidate: false, throwOnError: false })
      .catch(() => undefined),
    apiServer<Member[]>(`/v1/workspaces/${id}/members`, { revalidate: false, throwOnError: false })
      .catch(() => undefined),
  ]);
  const list = listRaw ?? [];
  const members = membersRaw ?? [];
  const nameMap = Object.fromEntries(members.map((m) => [m.id, m.user?.displayName ?? '']));
  const totalSpend = list.reduce((s, e) => s + BigInt(e.totalMinor || '0'), 0n);
  const currency = list[0]?.currency ?? 'INR';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Expenses</h2>
          {list.length > 0 && (
            <p className="text-muted" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
              {list.length} expense{list.length !== 1 ? 's' : ''} · Total {formatMoney(totalSpend.toString(), currency)}
            </p>
          )}
        </div>
        <Link href={`/circles/${id}/expenses/new`} className="btn btn--primary">Add expense</Link>
      </div>
      {list.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>No expenses yet. Start by adding your first expense to this circle.</p>
          <Link href={`/circles/${id}/expenses/new`} className="btn btn--outline">Add first expense</Link>
        </div>
      ) : (
        <ExpenseTable workspaceId={id} expenses={list} nameMap={nameMap} />
      )}
    </div>
  );
}
