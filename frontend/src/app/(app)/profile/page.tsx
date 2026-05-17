import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { apiServer } from '@/lib/api/server';

export const metadata = { title: 'Your profile' };

interface UserMe {
  id: string;
  email: string;
  displayName: string;
  phone: string | null;
  avatarUrl: string | null;
  emailVerifiedAt: string | null;
  role: string;
  createdAt: string;
}

export default async function ProfilePage(): Promise<JSX.Element> {
  const session = await getSession();
  if (!session) redirect('/login');

  const data = await apiServer<UserMe>('/v1/users/me', { revalidate: false, throwOnError: false })
    .catch(() => null);

  const display = data?.displayName?.trim() || session.email.split('@')[0];
  const email = data?.email ?? session.email;

  return (
    <AppShell>
      <header className="page-head">
        <div>
          <div className="page-head__eyebrow">Your account</div>
          <h1>Profile</h1>
          <p className="page-head__sub">Personal details, lifetime activity, and quick links to settings that affect every circle you're part of.</p>
        </div>
        <div className="page-head__actions">
          <Link href="/settings" className="btn btn--outline btn--sm">Edit profile</Link>
          <Link href="/settings/security" className="btn btn--ghost btn--sm">Security</Link>
        </div>
      </header>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
        <span className="list-item__avatar" style={{ width: 72, height: 72, fontSize: '1.5rem' }}>{display.slice(0, 2).toUpperCase()}</span>
        <div style={{ flex: 1 }}>
          <h3 className="card__title" style={{ marginBottom: '0.25rem' }}>{display}</h3>
          <div className="text-secondary">{email}</div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <span className={'pill ' + (data?.emailVerifiedAt ? 'pill--positive' : 'pill--warning')}>
              {data?.emailVerifiedAt ? 'Email verified' : 'Email unverified'}
            </span>
            <span className="pill">{data?.role === 'admin' || session.role === 'admin' ? 'Admin' : 'Member'}</span>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__label">Email</div>
          <div className="stat-card__value" style={{ fontSize: '1rem', wordBreak: 'break-all' }}>{email}</div>
          <div className="stat-card__delta">{data?.emailVerifiedAt ? 'Verified' : 'Unverified'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Phone</div>
          <div className="stat-card__value" style={{ fontSize: '1rem' }}>{data?.phone || '—'}</div>
          <div className="stat-card__delta">{data?.phone ? 'On file' : 'Not added'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Role</div>
          <div className="stat-card__value" style={{ fontSize: '1rem', textTransform: 'capitalize' }}>{data?.role ?? session.role}</div>
          <div className="stat-card__delta">Account type</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Member since</div>
          <div className="stat-card__value" style={{ fontSize: '1rem' }}>{data?.createdAt ? new Date(data.createdAt).toLocaleDateString() : '—'}</div>
          <div className="stat-card__delta">Joined date</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="card__title" style={{ marginBottom: '0.5rem' }}>Account details</h3>
        <p className="card__subtitle">These details appear to your circle members.</p>
        <table className="table">
          <tbody>
            <tr><th style={{ width: 200 }}>Display name</th><td>{display}</td></tr>
            <tr><th>Email</th><td>{email}</td></tr>
            <tr><th>Phone</th><td className="text-secondary">{data?.phone || 'Not added'}</td></tr>
            <tr><th>Member since</th><td className="text-secondary">{data?.createdAt ? new Date(data.createdAt).toLocaleDateString() : '—'}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 className="card__title" style={{ marginBottom: '0.5rem' }}>Quick links</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Link href="/settings" className="btn btn--outline btn--sm">Account settings</Link>
          <Link href="/settings/security" className="btn btn--outline btn--sm">Password & security</Link>
          <Link href="/settings/notifications" className="btn btn--outline btn--sm">Notification preferences</Link>
          <Link href="/circles" className="btn btn--ghost btn--sm">Your circles</Link>
          <Link href="/reports" className="btn btn--ghost btn--sm">Your reports</Link>
        </div>
      </div>
    </AppShell>
  );
}
