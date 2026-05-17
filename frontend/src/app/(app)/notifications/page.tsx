import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { apiServer } from '@/lib/api/server';

export const metadata = { title: 'Notifications' };

interface NotificationItem {
  id: string;
  kind: 'invitation' | 'expense' | 'settlement' | 'mention' | 'system';
  title: string;
  body?: string;
  href?: string;
  readAt: string | null;
  createdAt: string;
}

const KIND_LABEL: Record<NotificationItem['kind'], string> = {
  invitation: 'Invitation',
  expense:    'Expense',
  settlement: 'Settlement',
  mention:    'Mention',
  system:     'System',
};

export default async function NotificationsPage(): Promise<JSX.Element> {
  if (!(await getSession())) redirect('/login');
  const items = (await apiServer<NotificationItem[]>('/v1/notifications', { revalidate: false, throwOnError: false })
    .catch(() => [] as NotificationItem[])) ?? ([] as NotificationItem[]);
  const unread = items.filter(i => i.readAt === null).length;

  return (
    <AppShell>
      <header className="page-head">
        <div>
          <div className="page-head__eyebrow">Inbox</div>
          <h1>Notifications</h1>
          <p className="page-head__sub">Mentions, invitations, settlements, and everything BuddySplit pinged you about.</p>
        </div>
        <div className="page-head__actions">
          <span className="pill">{unread} unread</span>
          <Link href="/settings" className="btn btn--ghost btn--sm">Notification preferences</Link>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="empty-state">
          <p style={{ marginBottom: '0.75rem' }}>You're all caught up.</p>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>New activity in your circles will show up here in real time.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {items.map((n) => {
            const Wrapper: React.ElementType = n.href ? Link : 'div';
            return (
              <Wrapper key={n.id} href={n.href} className="list-item" style={n.readAt === null ? { background: 'var(--bg-surface)' } : undefined}>
                <span className={'list-item__avatar' + (n.readAt === null ? '' : ' list-item__avatar--neutral')}>{KIND_LABEL[n.kind].slice(0, 1)}</span>
                <div className="list-item__body">
                  <div className="list-item__title">{n.title}</div>
                  {n.body && <div className="list-item__meta">{n.body}</div>}
                  <div className="list-item__meta" style={{ marginTop: '0.25rem' }}>
                    <span className="pill">{KIND_LABEL[n.kind]}</span>
                    {n.readAt === null && <span style={{ marginLeft: '0.5rem', color: 'var(--positive)' }}>● New</span>}
                  </div>
                </div>
                <div className="list-item__trail">{new Date(n.createdAt).toLocaleString()}</div>
              </Wrapper>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
