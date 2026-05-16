import { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { apiServer } from '@/lib/api/server';
import { WorkspaceLiveSync } from './WorkspaceLiveSync';

interface Workspace { id: string; name: string; currency: string; status: string; kind: string; epoch: number }

export default async function WorkspaceLayout(
  { children, params }: { children: ReactNode; params: { id: string } },
): Promise<JSX.Element> {
  if (!(await getSession())) redirect('/login');
  const ws = await apiServer<Workspace>(`/v1/workspaces/${params.id}`, { revalidate: false });
  const base = `/workspaces/${ws.id}`;
  const tabs = [
    { href: base,                  label: 'Overview' },
    { href: `${base}/expenses`,    label: 'Expenses' },
    { href: `${base}/settlements`, label: 'Settlements' },
    { href: `${base}/members`,     label: 'Members' },
  ];

  return (
    <AppShell>
      <WorkspaceLiveSync workspaceId={ws.id} />
      <header style={{ marginBottom: '1.5rem' }}>
        <div className="text-uppercase-label">{ws.kind} · {ws.currency}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ margin: 0 }}>{ws.name}</h1>
          <span className={'pill pill--' + (ws.status === 'active' ? 'positive' : 'warning')}>{ws.status}</span>
        </div>
      </header>

      <nav style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className="btn btn--ghost" style={{ borderRadius: 0, borderBottom: '2px solid transparent', padding: '0.85rem 1.25rem' }}>
            {t.label}
          </Link>
        ))}
      </nav>

      {children}
    </AppShell>
  );
}
