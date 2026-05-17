import { apiServer } from '@/lib/api/server';
import { ExpenseForm } from './ExpenseForm';

interface ApiMember {
  userId: string;
  user: { displayName: string };
}
interface Workspace { id: string; baseCurrency: string }

export default async function NewExpensePage({ params }: { params: Promise<{ id: string }> }): Promise<JSX.Element> {
  const { id } = await params;
  const [ws, rawMembers] = await Promise.all([
    apiServer<Workspace>(`/v1/workspaces/${id}`, { revalidate: false }),
    apiServer<ApiMember[]>(`/v1/workspaces/${id}/members`, { revalidate: false, throwOnError: false }).catch(() => null) ?? [] as ApiMember[],
  ]);
  const members = (rawMembers ?? []).map(m => ({ userId: m.userId, displayName: m.user?.displayName ?? '' }));
  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Add expense</h2>
      <ExpenseForm workspaceId={ws.id} currency={ws.baseCurrency} members={members} />
    </div>
  );
}
