import { apiServer } from '@/lib/api/server';
import { MembersInvite } from './MembersInvite';

interface ApiMember {
  userId: string; role: string; joinedAt: string;
  user: { displayName: string; email: string };
}
interface Member { userId: string; displayName: string; email: string; role: string; joinedAt: string }

export default async function MembersPage({ params }: { params: Promise<{ id: string }> }): Promise<JSX.Element> {
  const { id } = await params;
  const raw = await apiServer<ApiMember[]>(`/v1/workspaces/${id}/members`, { revalidate: false, throwOnError: false }).catch(() => null) ?? [] as ApiMember[];
  const list: Member[] = (raw ?? []).map(m => ({
    userId: m.userId,
    displayName: m.user?.displayName ?? '',
    email: m.user?.email ?? '',
    role: m.role,
    joinedAt: m.joinedAt,
  }));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Members</h2>
        <MembersInvite workspaceId={id} />
      </div>
      {list.length === 0 ? (
        <div className="empty-state">No members yet.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
            <tbody>
              {list.map(m => (
                <tr key={m.userId}>
                  <td>{m.displayName}</td>
                  <td className="text-secondary">{m.email}</td>
                  <td><span className="pill">{m.role}</span></td>
                  <td className="text-secondary">{new Date(m.joinedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
