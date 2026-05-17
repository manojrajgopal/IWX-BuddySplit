import { ReactNode } from 'react';
import Link from 'next/link';
import { getBranding, getPublicSettings, settingString } from '@/lib/cms';
import {
  IconScale, IconZap, IconShield, IconGlobe, IconUsers,
} from '@/components/auth/Icons';
export { AuthTrust } from '@/components/auth/AuthTrust';

interface Props {
  children: ReactNode;
  variant?: 'login' | 'register' | 'reset';
}

const FEATURES = [
  { kicker: '01 / Real-time',  icon: <IconZap size={14} />,    title: 'See every change instantly', body: 'Live socket sync keeps your group page up-to-date the moment anyone adds an expense.' },
  { kicker: '02 / Exact math', icon: <IconScale size={14} />,  title: 'Integer-only money',         body: 'Every paisa, cent and penny accounted for using deterministic largest-remainder rounding.' },
  { kicker: '03 / Settle',     icon: <IconUsers size={14} />,  title: 'Fewest possible transfers',  body: 'Owe-chains are collapsed by a greedy creditor-debtor matcher into a minimal set of payments.' },
  { kicker: '04 / Multi-cur',  icon: <IconGlobe size={14} />,  title: 'Every currency, native',     body: 'INR, USD, EUR, JPY, BHD — minor-unit precision and per-currency rounding rules baked in.' },
];

const STATS = [
  { value: '6',     label: 'Split modes' },
  { value: '0',     label: 'Hidden fees' },
  { value: '24/7',  label: 'Realtime sync' },
  { value: '100%',  label: 'Self-hostable' },
];

export async function AuthShell({ children, variant = 'login' }: Props): Promise<JSX.Element> {
  const [settings, brand] = await Promise.all([getPublicSettings(), getBranding()]);
  const appName = settingString(settings, 'app.name', 'IWX-BuddySplit');
  const tagline = settingString(settings, 'app.tagline', 'Track every rupee. Settle every chain.');
  const logo = brand['logo'];
  const year = new Date().getFullYear();

  const heroByVariant = {
    login: {
      kicker: 'Welcome back',
      lineA: 'Pick up where',
      lineB: 'your group left off.',
      sub: `${tagline} Sign in to view your shared workspaces, recent expenses and pending settlement transfers — exactly as you left them.`,
    },
    register: {
      kicker: 'Get started',
      lineA: 'Money clarity',
      lineB: 'for the people you split with.',
      sub: 'Create an account in under a minute. No payment details, no email marketing, no third-party trackers — just clean, exact expense sharing for your group.',
    },
    reset: {
      kicker: 'Password reset',
      lineA: 'Back into your',
      lineB: 'workspaces in a moment.',
      sub: 'We will email you a short code. Enter it on the next screen and you can choose a new password — your data and history remain untouched.',
    },
  }[variant];

  return (
    <div className="auth">
      <aside className="auth__panel">
        <div className="auth__panel-inner">
          <div className="auth__brand-row">
            <Link href="/" className="brand" aria-label={appName} style={{ margin: 0 }}>
              {logo ? (
                <img src={logo.url} alt={appName} width={28} height={28} style={{ borderRadius: 8 }} />
              ) : (
                <span className="brand__mark" />
              )}
              <span>{appName}</span>
            </Link>
            <span className="auth__eyebrow"><span className="auth__eyebrow-dot" /> Realtime · Encrypted · Free</span>
          </div>

          <div className="auth__hero">
            <div className="text-uppercase-label" style={{ marginBottom: '0.85rem' }}>{heroByVariant.kicker}</div>
            <h1>
              {heroByVariant.lineA}
              <br />
              <span className="muted">{heroByVariant.lineB}</span>
            </h1>
            <p>{heroByVariant.sub}</p>
          </div>

          <div className="auth__features">
            {FEATURES.map((f) => (
              <div key={f.kicker} className="auth__feature">
                <div className="auth__feature-kicker">{f.icon} {f.kicker}</div>
                <h4>{f.title}</h4>
                <p>{f.body}</p>
              </div>
            ))}
          </div>

          <div className="auth__stats" aria-label="Platform statistics">
            {STATS.map((s) => (
              <div key={s.label} className="auth__stat">
                <div className="auth__stat-value">{s.value}</div>
                <div className="auth__stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="auth__panel-footer">
            <span>© {year} {settingString(settings, 'company.name', 'InfiniteWaveX')} · All rights reserved</span>
            <span style={{ display: 'inline-flex', gap: '1rem' }}>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/contact">Contact</Link>
            </span>
          </div>
        </div>
      </aside>

      <main className="auth__form-wrap">
        {children}
      </main>
    </div>
  );
}


