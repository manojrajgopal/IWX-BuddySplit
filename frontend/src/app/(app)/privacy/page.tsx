import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { getPublicSettings, settingString } from '@/lib/cms';

export const metadata = { title: 'Privacy' };

const SECTIONS = [
  { title: 'What we collect', body: 'Account basics (email, display name, hashed password), the expenses you log, the circles you create or join, and the settlements you mark as paid. We do not collect bank details, card numbers, or wallet identifiers.' },
  { title: 'What we never collect', body: 'No payment surface, no biometric data, no third-party advertising identifiers, no social-graph imports unless you explicitly invite a buddy by email.' },
  { title: 'How we use your data', body: 'Strictly to run BuddySplit for you and your circle members: showing balances, suggesting settlements, sending notifications you have opted into, and protecting your account from abuse.' },
  { title: 'Storage and security', body: 'Data is stored in PostgreSQL. Passwords are hashed with Argon2id. Refresh tokens are rotated on every use and bound to a specific device fingerprint. All transport is TLS-only.' },
  { title: 'Sharing with third parties', body: 'Never for marketing. We use no third-party analytics, no advertising networks, and no SaaS trackers. Email is delivered through your own SMTP relay when self-hosted, or through the operator’s relay otherwise.' },
  { title: 'Your controls', body: 'Export every expense and balance from your settings. Delete your account at any time — we permanently remove your personal records and anonymize any audit trail that is required to remain.' },
  { title: 'Cookies', body: 'We use one HttpOnly session cookie and one HttpOnly refresh cookie. No tracking cookies. No analytics cookies. No consent banner needed because we do not set anything that needs consent.' },
  { title: 'Children', body: 'BuddySplit is not directed at children under 13 and we do not knowingly collect data from them.' },
];

export default async function PrivacyPage(): Promise<JSX.Element> {
  const settings = await getPublicSettings();
  const company = settingString(settings, 'company.name', settingString(settings, 'app.name', 'IWX BuddySplit'));
  return (
    <AppShell>
      <header className="page-head">
        <div>
          <div className="page-head__eyebrow">Legal</div>
          <h1>Privacy notice</h1>
          <p className="page-head__sub">Last updated 2026 · Operator: {company}</p>
        </div>
        <div className="page-head__actions">
          <Link href="/terms" className="btn btn--ghost btn--sm">Terms</Link>
          <Link href="/help" className="btn btn--ghost btn--sm">Help</Link>
        </div>
      </header>

      <article className="card" style={{ maxWidth: 820 }}>
        <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
          This notice describes what {company} collects when you use BuddySplit, why, and what control you have. The product is built to need as little personal data as possible — please read it.
        </p>
        {SECTIONS.map((s) => (
          <section key={s.title} style={{ marginBottom: '1.5rem' }}>
            <h3 className="card__title" style={{ marginBottom: '0.4rem' }}>{s.title}</h3>
            <p className="text-secondary" style={{ fontSize: '0.92rem' }}>{s.body}</p>
          </section>
        ))}
        <p className="text-muted" style={{ fontSize: '0.82rem' }}>
          Questions? Write to <a href="mailto:privacy@buddysplit.example">privacy@buddysplit.example</a>.
        </p>
      </article>
    </AppShell>
  );
}
