import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { apiServer } from '@/lib/api/server';
import { WorkspaceLiveSync } from './WorkspaceLiveSync';
import { WorkspaceTabs } from './WorkspaceTabs';

interface Workspace { id: string; name: string; baseCurrency: string; status: string; kind: string; epoch: number }

export default async function WorkspaceLayout(
  { children, params }: { children: ReactNode; params: Promise<{ id: string }> },
): Promise<JSX.Element> {
  if (!(await getSession())) redirect('/login');
  const { id } = await params;
  const ws = await apiServer<Workspace>(`/v1/workspaces/${id}`, { revalidate: false });
  const base = `/circles/${ws.id}`;
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
        <div className="text-uppercase-label">{ws.kind} · {ws.baseCurrency}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ margin: 0 }}>{ws.name}</h1>
          <span className={'pill pill--' + (ws.status === 'active' ? 'positive' : 'warning')}>{ws.status}</span>
        </div>
      </header>

      <WorkspaceTabs tabs={tabs} />

      {children}
    </AppShell>
  );
}
