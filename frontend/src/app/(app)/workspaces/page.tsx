import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { apiServer } from '@/lib/api/server';

interface Workspace { id: string; name: string; currency: string; status: string; kind: string; memberCount: number; epoch: number }

export default async function WorkspacesPage(): Promise<JSX.Element> {
  if (!(await getSession())) redirect('/login');
  const list = await apiServer<Workspace[]>('/v1/workspaces', { revalidate: false, throwOnError: false }).catch(() => [] as Workspace[]);
  return (
    <AppShell>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="text-uppercase-label">All workspaces</div>
          <h1>Workspaces</h1>
        </div>
        <Link href="/workspaces/new" className="btn btn--primary">New workspace</Link>
      </header>
      {list.length === 0 ? (
        <div className="empty-state">No workspaces yet.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>Name</th><th>Kind</th><th>Members</th><th>Currency</th><th>Status</th></tr></thead>
            <tbody>
              {list.map((w) => (
                <tr key={w.id} style={{ cursor: 'pointer' }}>
                  <td><Link href={`/workspaces/${w.id}`}>{w.name}</Link></td>
                  <td className="text-secondary">{w.kind}</td>
                  <td>{w.memberCount}</td>
                  <td className="text-mono">{w.currency}</td>
                  <td><span className={'pill pill--' + (w.status === 'active' ? 'positive' : 'warning')}>{w.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
