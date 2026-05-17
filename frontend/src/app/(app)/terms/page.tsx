import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { getPublicSettings, settingString } from '@/lib/cms';

export const metadata = { title: 'Terms' };

const SECTIONS = [
  { title: 'Your account', body: 'You are responsible for keeping your sign-in credentials confidential and for every action taken under your account. Promptly notify us if you suspect unauthorized access.' },
  { title: 'Acceptable use', body: 'Do not use BuddySplit to harass, defraud, or impersonate anyone, to upload illegal content, to abuse our infrastructure, or to attempt to bypass security controls or rate limits.' },
  { title: 'Your content', body: 'You retain ownership of every expense description, attachment, and note you add to a circle. By adding content you grant the operator a limited license to store and display it to your circle members so the product can function.' },
  { title: 'Settlements', body: 'BuddySplit tracks balances and lets you mark transfers as paid. It is not a payment processor. We are not a party to any transfer of money between members.' },
  { title: 'Service availability', body: 'We work hard to keep the service available, but it is provided “as is” without warranty. Scheduled maintenance windows are announced in advance through the in-app notification system.' },
  { title: 'Termination', body: 'You can delete your account at any time from Settings. We may suspend or terminate accounts that violate these terms or that pose security risks to other members.' },
  { title: 'Liability', body: 'To the maximum extent allowed by law, the operator is not liable for indirect, incidental, or consequential damages. Total liability is limited to the amount you paid to use the service in the preceding 12 months (which, for the free tier, is zero).' },
  { title: 'Changes', body: 'We may update these terms. Material changes will be announced in-app at least 30 days before they take effect. Continued use after the effective date constitutes acceptance.' },
];

export default async function TermsPage(): Promise<JSX.Element> {
  const settings = await getPublicSettings();
  const company = settingString(settings, 'company.name', settingString(settings, 'app.name', 'IWX BuddySplit'));
  return (
    <AppShell>
      <header className="page-head">
        <div>
          <div className="page-head__eyebrow">Legal</div>
          <h1>Terms of service</h1>
          <p className="page-head__sub">Last updated 2026 · Operator: {company}</p>
        </div>
        <div className="page-head__actions">
          <Link href="/privacy" className="btn btn--ghost btn--sm">Privacy</Link>
          <Link href="/help" className="btn btn--ghost btn--sm">Help</Link>
        </div>
      </header>

      <article className="card" style={{ maxWidth: 820 }}>
        <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
          Welcome to BuddySplit. By creating an account or using the service operated by {company}, you agree to the terms below. Read them carefully.
        </p>
        {SECTIONS.map((s, i) => (
          <section key={s.title} style={{ marginBottom: '1.5rem' }}>
            <h3 className="card__title" style={{ marginBottom: '0.4rem' }}>{i + 1}. {s.title}</h3>
            <p className="text-secondary" style={{ fontSize: '0.92rem' }}>{s.body}</p>
          </section>
        ))}
        <p className="text-muted" style={{ fontSize: '0.82rem' }}>
          Questions? Write to <a href="mailto:legal@buddysplit.example">legal@buddysplit.example</a>.
        </p>
      </article>
    </AppShell>
  );
}
