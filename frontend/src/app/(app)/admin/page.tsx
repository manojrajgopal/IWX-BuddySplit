import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { apiServer } from '@/lib/api/server';

interface AdminStats { users: number; workspaces: number; expenses: number; settlements: number }

export default async function AdminPage(): Promise<JSX.Element> {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/dashboard');

  const stats = await apiServer<AdminStats>('/v1/admin/stats', { revalidate: false, throwOnError: false })
    .catch(() => ({ users: 0, workspaces: 0, expenses: 0, settlements: 0 } as AdminStats));

  return (
    <AppShell>
      <header style={{ marginBottom: '2rem' }}>
        <div className="text-uppercase-label">Admin</div>
        <h1>Platform overview</h1>
      </header>
      <div className="feature-grid">
        <div className="card"><div className="text-uppercase-label">Users</div><h2 style={{ marginTop: '0.5rem' }}>{stats.users}</h2></div>
        <div className="card"><div className="text-uppercase-label">Workspaces</div><h2 style={{ marginTop: '0.5rem' }}>{stats.workspaces}</h2></div>
        <div className="card"><div className="text-uppercase-label">Expenses</div><h2 style={{ marginTop: '0.5rem' }}>{stats.expenses}</h2></div>
        <div className="card"><div className="text-uppercase-label">Settlements</div><h2 style={{ marginTop: '0.5rem' }}>{stats.settlements}</h2></div>
      </div>
    </AppShell>
  );
}
