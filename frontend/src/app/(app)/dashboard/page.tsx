import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { apiServer } from '@/lib/api/server';
import Link from 'next/link';

interface DashboardSummary {
  workspaces: Array<{ id: string; name: string; currency: string; status: string; memberCount: number }>;
  unreadNotifications: number;
}

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await getSession();
  if (!session) redirect('/login');

  const summary = await apiServer<DashboardSummary>('/v1/dashboard/summary', { revalidate: false, throwOnError: false }).catch(() => null) ?? { workspaces: [], unreadNotifications: 0 } as DashboardSummary;

  return (
    <AppShell>
      <header style={{ marginBottom: '2rem' }}>
        <div className="text-uppercase-label">Overview</div>
        <h1>Welcome back</h1>
        <p className="text-secondary">Here's what's happening across your workspaces.</p>
      </header>

      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="card__title">Your workspaces</h3>
          <Link href="/workspaces/new" className="btn btn--primary btn--sm">New workspace</Link>
        </div>
        {summary.workspaces.length === 0 ? (
          <div className="empty-state">
            <p style={{ marginBottom: '1rem' }}>No workspaces yet.</p>
            <Link href="/workspaces/new" className="btn btn--outline">Create your first workspace</Link>
          </div>
        ) : (
          <div className="feature-grid">
            {summary.workspaces.map((w) => (
              <Link key={w.id} href={`/workspaces/${w.id}`} className="card card--hover" style={{ display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 className="card__title">{w.name}</h4>
                  <span className={'pill pill--' + (w.status === 'active' ? 'positive' : 'warning')}>{w.status}</span>
                </div>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {w.memberCount} member{w.memberCount === 1 ? '' : 's'} · {w.currency}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
