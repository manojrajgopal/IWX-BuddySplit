import { apiServer } from '@/lib/api/server';
import { ExpenseForm } from './ExpenseForm';

interface Member { userId: string; displayName: string }
interface Workspace { id: string; currency: string; members: Member[] }

export default async function NewExpensePage({ params }: { params: { id: string } }): Promise<JSX.Element> {
  const ws = await apiServer<Workspace>(`/v1/workspaces/${params.id}?withMembers=true`, { revalidate: false });
  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Add expense</h2>
      <ExpenseForm workspaceId={ws.id} currency={ws.currency} members={ws.members} />
    </div>
  );
}
