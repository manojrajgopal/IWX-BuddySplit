import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';

export const metadata = { title: 'Help center' };

const FAQS = [
  { q: 'How are amounts split between members?', a: 'Pick from six split modes when adding an expense: Equal, Exact amounts, Percentage, Shares, Equal + adjustments, or Itemized. Every mode runs through the same exact-math engine using integer minor units, so totals always reconcile to the cent.' },
  { q: 'Do you store my bank or card details?', a: 'No. BuddySplit never asks for any payment information. We track who-owes-who and let you mark transfers as paid using your own preferred payment app.' },
  { q: 'Can a circle use a currency that is different from mine?', a: 'Yes. Each circle has its own base currency. Members with a different personal base currency see balances converted using the daily reference rate.' },
  { q: 'How do invitations work?', a: 'Owners and admins of a circle can invite by email. Recipients get an invitation link that opens BuddySplit; they can accept or decline, and joining automatically creates a member record.' },
  { q: 'What happens if I delete an expense?', a: 'It is soft-deleted by default and balances re-compute immediately. An audit-log entry is written so other members can see the change in Activity.' },
  { q: 'Is my data encrypted?', a: 'Yes. Connections use TLS in transit, secrets are hashed with Argon2id at rest, refresh tokens rotate on every use, and access tokens live only in HttpOnly cookies.' },
];

const TOPICS = [
  { title: 'Getting started', desc: 'Create your first circle, invite buddies, and log your first expense.', href: '/circles/new' },
  { title: 'Splitting expenses', desc: 'Choose between equal, exact, percentage, share, adjustment, or itemized splits.', href: '/help#splits' },
  { title: 'Settlements', desc: 'Use suggested transfers to settle the smallest number of payments.', href: '/help#settle' },
  { title: 'Inviting members', desc: 'Bring in friends by email and manage roles per circle.', href: '/help#invite' },
  { title: 'Notifications', desc: 'Pick what you want pinged about and how often.', href: '/settings' },
  { title: 'Privacy & security', desc: 'How we protect your account and your data.', href: '/privacy' },
];

export default function HelpPage(): JSX.Element {
  return (
    <AppShell>
      <header className="page-head">
        <div>
          <div className="page-head__eyebrow">Support</div>
          <h1>Help center</h1>
          <p className="page-head__sub">Quick answers to the questions most BuddySplit users have, plus a link to talk to a real person.</p>
        </div>
        <div className="page-head__actions">
          <a href="mailto:support@buddysplit.example" className="btn btn--primary btn--sm">Email support</a>
          <Link href="/about" className="btn btn--ghost btn--sm">About</Link>
        </div>
      </header>

      <section style={{ marginBottom: '2.5rem' }}>
        <h3 className="card__title" style={{ marginBottom: '1rem' }}>Browse by topic</h3>
        <div className="feature-grid">
          {TOPICS.map((t) => (
            <Link key={t.title} href={t.href} className="card card--hover" style={{ display: 'block' }}>
              <h4 className="card__title">{t.title}</h4>
              <p className="text-secondary" style={{ fontSize: '0.88rem', marginTop: '0.35rem' }}>{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h3 className="card__title" style={{ marginBottom: '1rem' }}>Frequently asked</h3>
        <div className="card" style={{ padding: 0 }}>
          {FAQS.map((f, i) => (
            <details key={f.q} style={{ padding: '1rem 1.25rem', borderBottom: i === FAQS.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{f.q}</span>
                <span className="text-muted" style={{ fontSize: '1.2rem' }}>+</span>
              </summary>
              <p className="text-secondary" style={{ marginTop: '0.65rem', fontSize: '0.92rem' }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
