import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { getPublicSettings, settingString } from '@/lib/cms';

export const metadata = { title: 'About' };

const PILLARS = [
  { title: 'Real-time first', body: 'Every expense, edit, and settlement broadcasts to every other member instantly over a secure WebSocket — no refresh needed.' },
  { title: 'Exact math', body: 'Money is always stored in integer minor units and split with provably-correct algorithms. Pennies never get lost.' },
  { title: 'No payment surface', body: 'We never see your bank, card, or wallet details. We track balances; you settle however you like.' },
  { title: 'Self-hostable', body: 'Open architecture, no third-party SaaS dependencies, no analytics trackers. Bring your own database and SMTP.' },
];

export default async function AboutPage(): Promise<JSX.Element> {
  const settings = await getPublicSettings();
  const appName = settingString(settings, 'app.name', 'IWX BuddySplit');
  const company = settingString(settings, 'company.name', appName);
  const desc = settingString(settings, 'app.description', 'Real-time expense sharing and settlement.');

  return (
    <AppShell>
      <header className="page-head">
        <div>
          <div className="page-head__eyebrow">Our story</div>
          <h1>About {appName}</h1>
          <p className="page-head__sub">{desc}</p>
        </div>
        <div className="page-head__actions">
          <Link href="/help" className="btn btn--ghost btn--sm">Help center</Link>
          <Link href="/register" className="btn btn--primary btn--sm">Create account</Link>
        </div>
      </header>

      <section className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="card__title">Why we built this</h3>
        <p className="text-secondary" style={{ marginTop: '0.5rem' }}>
          Splitting expenses with the people you live, travel, or work with should feel like a shared journal — not a spreadsheet, and definitely not a payment processor. {appName} was built to be the simplest possible way for a group of buddies to keep their money honest in real time, without ever handing over their financial data.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h3 className="card__title" style={{ marginBottom: '1rem' }}>Pillars</h3>
        <div className="feature-grid">
          {PILLARS.map((p) => (
            <div key={p.title} className="card">
              <h4 className="card__title">{p.title}</h4>
              <p className="text-secondary" style={{ fontSize: '0.9rem', marginTop: '0.35rem' }}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 className="card__title">The basics</h3>
        <table className="table" style={{ marginTop: '0.5rem' }}>
          <tbody>
            <tr><th style={{ width: 220 }}>Product name</th><td>{appName}</td></tr>
            <tr><th>Operated by</th><td>{company}</td></tr>
            <tr><th>Started</th><td className="text-secondary">2025</td></tr>
            <tr><th>Pricing</th><td>Free, forever. No ads, no upsells, no tracking.</td></tr>
            <tr><th>Source</th><td className="text-secondary">Self-hostable; bring your own database, queue, and SMTP.</td></tr>
            <tr><th>Privacy</th><td><Link href="/privacy">Read our privacy notice</Link></td></tr>
            <tr><th>Terms</th><td><Link href="/terms">Read the terms of service</Link></td></tr>
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
