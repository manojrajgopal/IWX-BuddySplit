import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { apiServer } from '@/lib/api/server';

interface Workspace { id: string; name: string; baseCurrency: string; status: string; kind: string; epoch: number; memberCount: number }

export default async function WorkspacesPage(): Promise<JSX.Element> {
  if (!(await getSession())) redirect('/login');
  const list = await apiServer<Workspace[]>('/v1/workspaces', { revalidate: false, throwOnError: false }).catch(() => [] as Workspace[]);
  return (
    <AppShell>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="text-uppercase-label">All circles</div>
          <h1>Circles</h1>
          <p className="text-secondary" style={{ marginTop: '0.35rem' }}>Every group, trip, household, or event you split expenses with.</p>
        </div>
        <Link href="/circles/new" className="btn btn--primary">New circle</Link>
      </header>
      {list.length === 0 ? (
        <div className="empty-state">
          <p style={{ marginBottom: '1rem' }}>No circles yet. A circle is a group of buddies sharing expenses.</p>
          <Link href="/circles/new" className="btn btn--outline">Create your first circle</Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>Name</th><th>Kind</th><th>Members</th><th>Currency</th><th>Status</th></tr></thead>
            <tbody>
              {list.map((w) => (
                <tr key={w.id} className="table__row--link">
                  <td><Link href={`/circles/${w.id}`}>{w.name}</Link></td>
                  <td><Link href={`/circles/${w.id}`} className="text-secondary" tabIndex={-1}>{w.kind}</Link></td>
                  <td><Link href={`/circles/${w.id}`} tabIndex={-1}>{w.memberCount}</Link></td>
                  <td><Link href={`/circles/${w.id}`} className="text-mono" tabIndex={-1}>{w.baseCurrency}</Link></td>
                  <td><Link href={`/circles/${w.id}`} tabIndex={-1}><span className={'pill pill--' + (w.status === 'active' ? 'positive' : 'warning')}>{w.status}</span></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
