import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { NotificationsForm } from './NotificationsForm';

export default async function NotificationSettingsPage(): Promise<JSX.Element> {
  return (
    <AppShell>
      <header className="page-head">
        <div>
          <div className="page-head__eyebrow">Settings</div>
          <h1>Notifications</h1>
          <p className="page-head__sub">Pick what we ping you about and which channels to use. Security alerts cannot be disabled.</p>
        </div>
        <div className="page-head__actions">
          <Link href="/settings" className="btn btn--ghost btn--sm">Profile</Link>
          <Link href="/settings/security" className="btn btn--ghost btn--sm">Security</Link>
        </div>
      </header>

      <NotificationsForm />
    </AppShell>
  );
}
