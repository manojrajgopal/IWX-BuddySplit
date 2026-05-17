import Link from 'next/link';
import { apiServer } from '@/lib/api/server';
import { ExpenseTable } from './ExpenseTable';

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
  const [list, members] = await Promise.all([
    apiServer<Expense[]>(`/v1/workspaces/${id}/expenses`, { revalidate: false, throwOnError: false })
      .catch(() => [] as Expense[]) ?? [],
    apiServer<Member[]>(`/v1/workspaces/${id}/members`, { revalidate: false, throwOnError: false })
      .catch(() => [] as Member[]) ?? [],
  ]);
  const nameMap = Object.fromEntries(members.map((m) => [m.id, m.user?.displayName ?? '']));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0 }}>Expenses</h2>
        <Link href={`/circles/${id}/expenses/new`} className="btn btn--primary">Add expense</Link>
      </div>
      {list.length === 0 ? (
        <div className="empty-state">No expenses yet.</div>
      ) : (
        <ExpenseTable workspaceId={id} expenses={list} nameMap={nameMap} />
      )}
    </div>
  );
}
