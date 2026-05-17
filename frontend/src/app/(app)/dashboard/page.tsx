import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { apiServer } from '@/lib/api/server';
import Link from 'next/link';

interface Workspace {
  id: string; name: string; baseCurrency: string; status: string; kind: string;
}

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await getSession();
  if (!session) redirect('/login');

  const [workspaces, unread] = await Promise.all([
    apiServer<Workspace[]>('/v1/workspaces', { revalidate: false, throwOnError: false }) ?? [],
    apiServer<{ count: number }>('/v1/notifications/unread-count', { revalidate: false, throwOnError: false }),
  ]).catch(() => [[] as Workspace[], { count: 0 }] as const);
  const list = workspaces ?? [] as Workspace[];
  const unreadCount = (unread as { count: number })?.count ?? 0;

  return (
    <AppShell>
      <header style={{ marginBottom: '2rem' }}>
        <div className="text-uppercase-label">Overview</div>
        <h1>Welcome back</h1>
        <p className="text-secondary">Here's what's happening across your circles.</p>
      </header>

      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="card__title">Your circles</h3>
          <Link href="/circles/new" className="btn btn--primary btn--sm">New circle</Link>
        </div>
        {list.length === 0 ? (
          <div className="empty-state">
            <p style={{ marginBottom: '1rem' }}>No circles yet.</p>
            <Link href="/circles/new" className="btn btn--outline">Create your first circle</Link>
          </div>
        ) : (
          <div className="feature-grid">
            {list.map((w) => (
              <Link key={w.id} href={`/circles/${w.id}`} className="card card--hover" style={{ display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 className="card__title">{w.name}</h4>
                  <span className={'pill pill--' + (w.status === 'active' ? 'positive' : 'warning')}>{w.status}</span>
                </div>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {w.kind} · {w.baseCurrency}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
