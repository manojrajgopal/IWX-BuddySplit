import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { apiServer } from '@/lib/api/server';
import { formatMoney } from '@/lib/money/format';

export const metadata = { title: 'Activity' };

interface ActivityItem {
  id: string;
  type: 'expense.created' | 'expense.updated' | 'expense.deleted' | 'settlement.recorded' | 'member.joined' | 'circle.created';
  workspaceId: string;
  workspaceName: string;
  actorName: string;
  summary: string;
  amount?: string;
  currency?: string;
  occurredAt: string;
}

const TYPE_META: Record<ActivityItem['type'], { kind: string; tone: string }> = {
  'expense.created':    { kind: 'Expense added',     tone: 'pill--positive' },
  'expense.updated':    { kind: 'Expense edited',    tone: 'pill' },
  'expense.deleted':    { kind: 'Expense removed',   tone: 'pill--negative' },
  'settlement.recorded':{ kind: 'Settlement',        tone: 'pill--positive' },
  'member.joined':      { kind: 'New member',        tone: 'pill' },
  'circle.created':     { kind: 'Circle created',    tone: 'pill--warning' },
};

export default async function ActivityPage(): Promise<JSX.Element> {
  if (!(await getSession())) redirect('/login');

  const items = (await apiServer<ActivityItem[]>('/v1/activity', { revalidate: false, throwOnError: false })
    .catch(() => [] as ActivityItem[])) ?? ([] as ActivityItem[]);

  return (
    <AppShell>
      <header className="page-head">
        <div>
          <div className="page-head__eyebrow">Recent</div>
          <h1>Activity</h1>
          <p className="page-head__sub">Every expense, edit, settlement, invite, and circle change across all your buddy groups — newest first.</p>
        </div>
        <div className="page-head__actions">
          <Link href="/notifications" className="btn btn--outline btn--sm">Notifications</Link>
          <Link href="/reports" className="btn btn--ghost btn--sm">Reports</Link>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="empty-state">
          <p style={{ marginBottom: '0.75rem' }}>No activity yet.</p>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Activity appears here as soon as someone adds an expense or records a settlement.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {items.map((a) => {
            const meta = TYPE_META[a.type];
            return (
              <div key={a.id} className="list-item">
                <span className="list-item__avatar">{a.actorName.slice(0, 2).toUpperCase()}</span>
                <div className="list-item__body">
                  <div className="list-item__title">
                    {a.actorName} <span className="text-secondary" style={{ fontWeight: 400 }}>{a.summary}</span>
                  </div>
                  <div className="list-item__meta">
                    <span className={'pill ' + meta.tone} style={{ marginRight: '0.5rem' }}>{meta.kind}</span>
                    <Link href={`/circles/${a.workspaceId}`} className="text-secondary">{a.workspaceName}</Link>
                    {a.amount && a.currency && (
                      <span className="text-mono" style={{ marginLeft: '0.5rem' }}>· {formatMoney(a.amount, a.currency)}</span>
                    )}
                  </div>
                </div>
                <div className="list-item__trail">{new Date(a.occurredAt).toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
