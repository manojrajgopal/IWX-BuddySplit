import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { apiServer } from '@/lib/api/server';
import { formatMoney } from '@/lib/money/format';
import { FriendsInvite } from './FriendsInvite';

export const metadata = { title: 'Friends' };

interface Friend {
  userId: string;
  displayName: string;
  email: string;
  sharedCircles: number;
  netBalance: string;
  currency: string;
  lastActiveAt: string | null;
}

export default async function FriendsPage(): Promise<JSX.Element> {
  if (!(await getSession())) redirect('/login');
  const list = (await apiServer<Friend[]>('/v1/friends', { revalidate: false, throwOnError: false })
    .catch(() => [] as Friend[])) ?? ([] as Friend[]);

  return (
    <AppShell>
      <header className="page-head">
        <div>
          <div className="page-head__eyebrow">People</div>
          <h1>Friends</h1>
          <p className="page-head__sub">Everyone you've ever split an expense with, plus your running balance with each of them.</p>
        </div>
        <FriendsInvite />
      </header>

      {list.length === 0 ? (
        <div className="empty-state">
          <p style={{ marginBottom: '0.75rem' }}>No friends yet.</p>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Invite a buddy by email, or add them inside any circle.</p>
          <Link href="/circles/new" className="btn btn--outline">Start a circle</Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {list.map((f) => {
            const positive = BigInt(f.netBalance) >= 0n;
            return (
              <div key={f.userId} className="list-item">
                <span className="list-item__avatar">{f.displayName.slice(0, 2).toUpperCase()}</span>
                <div className="list-item__body">
                  <div className="list-item__title">{f.displayName}</div>
                  <div className="list-item__meta">{f.email} · {f.sharedCircles} shared circle{f.sharedCircles === 1 ? '' : 's'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={'text-mono ' + (positive ? 'text-positive' : 'text-negative')}>{formatMoney(f.netBalance, f.currency)}</div>
                  <div className="list-item__trail">{positive ? 'They owe you' : 'You owe them'}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
