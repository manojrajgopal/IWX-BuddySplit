import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { apiServer } from '@/lib/api/server';
import { Reveal } from '@/components/cms/Reveal';
import { AnimatedCounter } from '@/components/cms/AnimatedCounter';
import { TestimonialCarousel } from '@/components/cms/TestimonialCarousel';
import { NewsletterForm } from '@/components/cms/NewsletterForm';
import { MoneyJourneyAnimation } from '@/components/cms/MoneyJourneyAnimation';

export const metadata = { title: 'Home' };

interface Workspace {
  id: string;
  name: string;
  baseCurrency: string;
  status: string;
  kind: string;
}

interface Friend {
  userId: string;
  displayName: string;
  email: string;
  sharedCircles: number;
  netBalance: string;
  currency: string;
}

interface MeProfile { displayName?: string | null; email?: string | null }

export default async function HomePage(): Promise<JSX.Element> {
  const session = await getSession();
  if (!session) redirect('/login');

  const [workspacesRaw, unreadRaw, friendsRaw, meRaw] = await Promise.all([
    apiServer<Workspace[]>('/v1/workspaces', { revalidate: false, throwOnError: false }).catch(() => null),
    apiServer<{ count: number }>('/v1/notifications/unread-count', { revalidate: false, throwOnError: false }).catch(() => null),
    apiServer<Friend[]>('/v1/friends', { revalidate: false, throwOnError: false }).catch(() => null),
    apiServer<MeProfile>('/v1/users/me', { revalidate: false, throwOnError: false }).catch(() => null),
  ]);

  const circles: Workspace[] = workspacesRaw ?? [];
  const friends: Friend[] = friendsRaw ?? [];
  const unread = unreadRaw?.count ?? 0;
  const firstName = (meRaw?.displayName || session.email.split('@')[0] || 'there').split(/\s+/)[0];

  const activeCircles = circles.filter((c) => c.status === 'active').length;
  const completedCircles = circles.filter((c) => c.status === 'completed').length;
  const tripCircles = circles.filter((c) => /trip|travel|holiday/i.test(c.kind || c.name)).length;
  const recentCircles = circles.slice(0, 6);

  return (
    <AppShell>
      {/* ───── Hero / Welcome ───── */}
      <section className="home-hero fade-in-up">
        <div className="home-hero__blob home-hero__blob--1" aria-hidden />
        <div className="home-hero__blob home-hero__blob--2" aria-hidden />
        <div className="home-hero__content">
          <div className="home-hero__badge">
            <span className="home-hero__dot" /> Welcome back
          </div>
          <h1 className="home-hero__title">
            Hi {firstName}, here&apos;s your <span className="home-hero__accent">money clarity</span> hub.
          </h1>
          <p className="home-hero__subtitle">
            Everything you need to track shared expenses, see who owes what, and settle up with friends, family,
            roommates, travel buddies and teams — all in one place. Browse your activity below, jump into any
            Circle, or learn how each feature works.
          </p>
          <div className="home-hero__actions">
            <Link href="/circles/new" className="btn btn--primary btn--lg">+ Create a new Circle</Link>
            <Link href="#your-circles" className="btn btn--outline btn--lg">Jump to my Circles</Link>
            <Link href="#how-it-works" className="btn btn--ghost btn--lg">How does it work?</Link>
          </div>
          <p className="home-hero__hint">
            Tip: every Circle is a private group where you and your people track expenses together — like a shared
            wallet that does the math for you.
          </p>
        </div>
      </section>

      {/* ───── Live user stats ───── */}
      <Reveal as="section" className="home-stats">
        <h2 className="home-section__title">Your snapshot</h2>
        <p className="home-section__lede">
          A quick view of your activity across {firstName}&apos;s account. These numbers update in real-time as you
          and your group add expenses, settle up, or join new Circles.
        </p>
        <div className="home-stats__grid">
          <Link href="/circles" className="stat-tile stat-tile--accent">
            <div className="stat-tile__icon" aria-hidden>🟢</div>
            <div className="stat-tile__value"><AnimatedCounter value={circles.length} /></div>
            <div className="stat-tile__label">Total Circles</div>
            <div className="stat-tile__hint">All your groups — active, paused and completed.</div>
          </Link>
          <Link href="/circles?status=active" className="stat-tile">
            <div className="stat-tile__icon" aria-hidden>⚡</div>
            <div className="stat-tile__value"><AnimatedCounter value={activeCircles} /></div>
            <div className="stat-tile__label">Active right now</div>
            <div className="stat-tile__hint">Circles where expenses are still being added.</div>
          </Link>
          <Link href="/friends" className="stat-tile">
            <div className="stat-tile__icon" aria-hidden>👥</div>
            <div className="stat-tile__value"><AnimatedCounter value={friends.length} /></div>
            <div className="stat-tile__label">Friends you share with</div>
            <div className="stat-tile__hint">People you&apos;ve split money with across all Circles.</div>
          </Link>
          <Link href="/circles" className="stat-tile">
            <div className="stat-tile__icon" aria-hidden>✈️</div>
            <div className="stat-tile__value"><AnimatedCounter value={tripCircles} /></div>
            <div className="stat-tile__label">Trips tracked</div>
            <div className="stat-tile__hint">Travel Circles you&apos;ve been a part of.</div>
          </Link>
          <Link href="/notifications" className="stat-tile">
            <div className="stat-tile__icon" aria-hidden>🔔</div>
            <div className="stat-tile__value"><AnimatedCounter value={unread} /></div>
            <div className="stat-tile__label">Unread notifications</div>
            <div className="stat-tile__hint">New invites, settlements and updates waiting for you.</div>
          </Link>
          <Link href="/reports" className="stat-tile">
            <div className="stat-tile__icon" aria-hidden>✅</div>
            <div className="stat-tile__value"><AnimatedCounter value={completedCircles} /></div>
            <div className="stat-tile__label">Settled Circles</div>
            <div className="stat-tile__hint">Trips and groups you&apos;ve fully settled. Nice work.</div>
          </Link>
        </div>
      </Reveal>

      {/* ───── 30-second short film ───── */}
      <Reveal as="section" className="home-section home-movie-section">
        <span className="section-label">Watch · 30 seconds</span>
        <h2 className="home-section__title">The story of every group trip — with &amp; without BuddySplit</h2>
        <p className="home-section__lede">
          Press play and watch the journey unfold: friends hit the road, expenses pile up, things get messy,
          BuddySplit steps in, the math sorts itself out — and everyone ends up smiling. A tiny film, a big idea.
        </p>
        <MoneyJourneyAnimation />
      </Reveal>

      {/* ───── Your circles ───── */}
      <Reveal as="section" className="home-section" >
        <div id="your-circles" />
        <div className="home-section__header">
          <div>
            <h2 className="home-section__title">Your Circles</h2>
            <p className="home-section__lede">
              Jump straight into any Circle, or create a new one for your next trip, flatshare or friend group.
            </p>
          </div>
          <Link href="/circles/new" className="btn btn--primary btn--sm">+ New Circle</Link>
        </div>
        {recentCircles.length === 0 ? (
          <div className="empty-cta">
            <div className="empty-cta__emoji">🪐</div>
            <h3>No Circles yet</h3>
            <p>
              A Circle is a private group for tracking shared expenses. Create one for your roommates, your next
              trip, a dinner club, or your office team. It takes less than a minute.
            </p>
            <div className="empty-cta__actions">
              <Link href="/circles/new" className="btn btn--primary btn--lg">Create your first Circle</Link>
              <Link href="#how-it-works" className="btn btn--ghost btn--lg">Learn how it works</Link>
            </div>
          </div>
        ) : (
          <div className="home-circles-grid">
            {recentCircles.map((w) => (
              <Link key={w.id} href={`/circles/${w.id}`} className="home-circle-card">
                <div className="home-circle-card__header">
                  <h4>{w.name}</h4>
                  <span className={'pill pill--' + (w.status === 'active' ? 'positive' : 'warning')}>{w.status}</span>
                </div>
                <p className="home-circle-card__meta">{w.kind} · {w.baseCurrency}</p>
                <span className="home-circle-card__cta">Open Circle →</span>
              </Link>
            ))}
          </div>
        )}
        {circles.length > 6 && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link href="/circles" className="btn btn--outline">See all {circles.length} Circles →</Link>
          </div>
        )}
      </Reveal>

      {/* ───── Quick navigation ───── */}
      <Reveal as="section" className="home-section home-section--alt">
        <h2 className="home-section__title">Where to next?</h2>
        <p className="home-section__lede">
          Every part of {firstName}&apos;s account is one click away. Hover any tile to learn what it does, then jump in.
        </p>
        <div className="quick-nav-grid">
          <Link href="/circles" className="quick-nav-tile">
            <span className="quick-nav-tile__icon" aria-hidden>🟢</span>
            <h4>My Circles</h4>
            <p>See every group you&apos;re part of, with status, balances and member counts at a glance.</p>
            <span className="quick-nav-tile__arrow">Open →</span>
          </Link>
          <Link href="/activity" className="quick-nav-tile">
            <span className="quick-nav-tile__icon" aria-hidden>📜</span>
            <h4>Activity feed</h4>
            <p>A live timeline of every expense added, every settlement recorded and every Circle event.</p>
            <span className="quick-nav-tile__arrow">Open →</span>
          </Link>
          <Link href="/reports" className="quick-nav-tile">
            <span className="quick-nav-tile__icon" aria-hidden>📊</span>
            <h4>Reports</h4>
            <p>Detailed breakdowns of who paid what, who owes whom, and how your spending stacks up.</p>
            <span className="quick-nav-tile__arrow">Open →</span>
          </Link>
          <Link href="/friends" className="quick-nav-tile">
            <span className="quick-nav-tile__icon" aria-hidden>👥</span>
            <h4>Friends</h4>
            <p>Everyone you&apos;ve split money with, including running balances and shared Circle counts.</p>
            <span className="quick-nav-tile__arrow">Open →</span>
          </Link>
          <Link href="/invitations" className="quick-nav-tile">
            <span className="quick-nav-tile__icon" aria-hidden>✉️</span>
            <h4>Invitations</h4>
            <p>Pending invites you&apos;ve received, plus ones you&apos;ve sent out to friends.</p>
            <span className="quick-nav-tile__arrow">Open →</span>
          </Link>
          <Link href="/notifications" className="quick-nav-tile">
            <span className="quick-nav-tile__icon" aria-hidden>🔔</span>
            <h4>Notifications</h4>
            <p>New expenses, settlement reminders, invite responses — everything that needs your attention.</p>
            <span className="quick-nav-tile__arrow">Open →</span>
          </Link>
          <Link href="/profile" className="quick-nav-tile">
            <span className="quick-nav-tile__icon" aria-hidden>🙂</span>
            <h4>My Profile</h4>
            <p>Update your display name, avatar, and how friends find you on BuddySplit.</p>
            <span className="quick-nav-tile__arrow">Open →</span>
          </Link>
          <Link href="/settings" className="quick-nav-tile">
            <span className="quick-nav-tile__icon" aria-hidden>⚙️</span>
            <h4>Settings</h4>
            <p>Change your password, default currency, notification preferences and security options.</p>
            <span className="quick-nav-tile__arrow">Open →</span>
          </Link>
          <Link href="/help" className="quick-nav-tile">
            <span className="quick-nav-tile__icon" aria-hidden>💡</span>
            <h4>Help center</h4>
            <p>Step-by-step guides, FAQs, and tips on getting the most out of every split mode.</p>
            <span className="quick-nav-tile__arrow">Open →</span>
          </Link>
        </div>
      </Reveal>

      {/* ───── How it works ───── */}
      <Reveal as="section" className="home-section">
        <div id="how-it-works" />
        <h2 className="home-section__title">How BuddySplit works in 4 simple steps</h2>
        <p className="home-section__lede">
          From sign-up to fully settled — here&apos;s the whole product in plain English. No technical talk, just
          how you&apos;ll actually use it.
        </p>
        <ol className="how-steps">
          <li className="how-step">
            <div className="how-step__num">1</div>
            <div className="how-step__body">
              <h4>Create a Circle</h4>
              <p>
                Think of a Circle as a private space for one group — your flatmates, your trip squad, your office
                team. Give it a name, pick a currency and you&apos;re done.
              </p>
              <Link href="/circles/new" className="btn btn--ghost btn--sm">+ Create a Circle</Link>
            </div>
          </li>
          <li className="how-step">
            <div className="how-step__num">2</div>
            <div className="how-step__body">
              <h4>Invite your people</h4>
              <p>
                Send a one-click email invite. They join in seconds — no setup, no awkward instructions. Even
                friends without an account can sign up with a single tap.
              </p>
              <Link href="/friends" className="btn btn--ghost btn--sm">Manage friends</Link>
            </div>
          </li>
          <li className="how-step">
            <div className="how-step__num">3</div>
            <div className="how-step__body">
              <h4>Add expenses as life happens</h4>
              <p>
                Paid for dinner? Booked the cab? Open the Circle, add the expense, choose how to split it. Everyone
                in the group sees it instantly — no refresh, no follow-up messages.
              </p>
              <Link href="/activity" className="btn btn--ghost btn--sm">View activity</Link>
            </div>
          </li>
          <li className="how-step">
            <div className="how-step__num">4</div>
            <div className="how-step__body">
              <h4>Settle up the smart way</h4>
              <p>
                When it&apos;s time to clear debts, BuddySplit figures out the fewest payments needed so the whole
                group settles in minutes — not weeks of back-and-forth UPI transfers.
              </p>
              <Link href="/reports" className="btn btn--ghost btn--sm">View reports</Link>
            </div>
          </li>
        </ol>
      </Reveal>

      {/* ───── Split modes explained ───── */}
      <Reveal as="section" className="home-section home-section--alt">
        <h2 className="home-section__title">Five ways to split — every paisa accounted for</h2>
        <p className="home-section__lede">
          No matter how your group prefers to share costs, there&apos;s a split mode that fits. Every calculation is
          precise — when ₹100 is split 3 ways, you get exactly ₹34 + ₹33 + ₹33. Nothing missing, nothing extra.
        </p>
        <div className="explain-grid">
          <article className="explain-card">
            <span className="explain-card__tag">Equal</span>
            <h4>Split equally</h4>
            <p>Classic split. Divide the total evenly. Extra paise are distributed fairly so the total always matches.</p>
          </article>
          <article className="explain-card">
            <span className="explain-card__tag">Exact</span>
            <h4>Split by exact amounts</h4>
            <p>&quot;I&apos;ll cover ₹500, you get the rest.&quot; Enter precise amounts for each person — the app checks it adds up.</p>
          </article>
          <article className="explain-card">
            <span className="explain-card__tag">Percentage</span>
            <h4>Split by percentage</h4>
            <p>Great for partners or housemates with different incomes. 60/40, 70/30, anything — must add up to 100%.</p>
          </article>
          <article className="explain-card">
            <span className="explain-card__tag">Shares</span>
            <h4>Split by shares (ratio)</h4>
            <p>Weight-based: 2 shares vs 1 share = 2/3 vs 1/3. Perfect for unequal contributions to a common pool.</p>
          </article>
          <article className="explain-card">
            <span className="explain-card__tag">Adjustment</span>
            <h4>Split with adjustments</h4>
            <p>Start equal, then nudge individual amounts. &quot;Equal but Amit pays ₹50 extra&quot; — real-world flexibility.</p>
          </article>
          <article className="explain-card explain-card--cta">
            <h4>Try a split now</h4>
            <p>Pick any Circle and add an expense to see all five modes in action.</p>
            <Link href="/circles" className="btn btn--primary btn--sm">Go to Circles</Link>
          </article>
        </div>
      </Reveal>

      {/* ───── Smart settlements ───── */}
      <Reveal as="section" className="home-section">
        <div className="settlement-explainer-home">
          <div>
            <span className="section-label">Smart settlements</span>
            <h2 className="home-section__title">Fewest payments. Zero confusion.</h2>
            <p className="home-section__lede">
              When it&apos;s time to settle, BuddySplit doesn&apos;t make everyone pay everyone else. It calculates
              the simplest chain of payments — usually just a handful of transfers — so the whole group is square
              in minutes.
            </p>
            <ul className="home-bullets">
              <li><strong>Minimum transfers:</strong> a group of 10 settles in at most 9 payments. Often far fewer.</li>
              <li><strong>Partial payments:</strong> can&apos;t pay the full amount today? Record what you can. Balances recalc automatically.</li>
              <li><strong>Permanent history:</strong> every payment is recorded with who, when and how much.</li>
              <li><strong>Always accurate:</strong> the same expenses always produce the same plan. No surprises.</li>
            </ul>
            <Link href="/reports" className="btn btn--outline">See settlement reports →</Link>
          </div>
          <div className="settlement-example">
            <h5>Real example — weekend trip with 4 friends</h5>
            <div className="settlement-example__row settlement-example__row--owed">
              <span>Priya is owed</span><strong>₹500</strong>
            </div>
            <div className="settlement-example__row"><span>Rahul owes</span><strong>₹200</strong></div>
            <div className="settlement-example__row"><span>Sneha owes</span><strong>₹150</strong></div>
            <div className="settlement-example__row"><span>Amit owes</span><strong>₹150</strong></div>
            <div className="settlement-example__divider">↓ BuddySplit suggests ↓</div>
            <div className="settlement-example__plan">
              <div>Rahul → Priya: <strong>₹200</strong></div>
              <div>Sneha → Priya: <strong>₹150</strong></div>
              <div>Amit → Priya: <strong>₹150</strong></div>
            </div>
            <div className="settlement-example__done">✓ Settled in 3 clean transfers</div>
          </div>
        </div>
      </Reveal>

      {/* ───── Use cases ───── */}
      <Reveal as="section" className="home-section home-section--alt">
        <h2 className="home-section__title">Built for every shared-money moment</h2>
        <p className="home-section__lede">
          Whether it&apos;s two people or twenty, one-time or ongoing — these are the most popular ways people use
          BuddySplit every day.
        </p>
        <div className="use-grid">
          <div className="use-tile"><span>🏠</span><h4>Roommates &amp; flatshares</h4><p>Rent, utilities, groceries, cleaning — month after month, with monthly settlement cycles.</p></div>
          <div className="use-tile"><span>✈️</span><h4>Trips &amp; travel</h4><p>Hotels, flights, meals, cabs. Add expenses on the go, settle everything at the end with minimum transfers.</p></div>
          <div className="use-tile"><span>🍕</span><h4>Friend groups</h4><p>The weekend dinner squad, the brunch crew. Running totals across dozens of outings, no spreadsheets.</p></div>
          <div className="use-tile"><span>💼</span><h4>Office &amp; teams</h4><p>Team lunches, supplies, conferences. Admins oversee, members add — export logs for reimbursement.</p></div>
          <div className="use-tile"><span>💑</span><h4>Couples &amp; partners</h4><p>Track shared household expenses transparently. Split proportionally by income, zero arguments.</p></div>
          <div className="use-tile"><span>🎉</span><h4>Events &amp; gifts</h4><p>Pool money for a birthday, wedding gift or party. Track contributions and split the cost fairly.</p></div>
        </div>
      </Reveal>

      {/* ───── Testimonials ───── */}
      <Reveal as="section" className="home-section">
        <span className="section-label">Loved by groups everywhere</span>
        <h2 className="home-section__title">What our users say</h2>
        <p className="home-section__lede">
          Real stories from real groups using BuddySplit for trips, flatshares, friend circles and office teams.
        </p>
        <TestimonialCarousel />
      </Reveal>

      {/* ───── Newsletter ───── */}
      <Reveal as="section" className="home-section home-newsletter">
        <div className="home-newsletter__inner">
          <div>
            <span className="section-label">Stay in the loop</span>
            <h2 className="home-section__title">Subscribe to the BuddySplit newsletter</h2>
            <p className="home-section__lede">
              One short email a month — product updates, smart money-splitting tips, real stories from groups using
              the app, and early access to brand-new features. No spam, ever. Unsubscribe in one click.
            </p>
          </div>
          <div className="home-newsletter__form">
            <NewsletterForm source="home" />
          </div>
        </div>
      </Reveal>

      {/* ───── Final CTA ───── */}
      <Reveal as="section" className="home-section home-final-cta">
        <h2>Ready to add your next expense?</h2>
        <p>Pick a Circle, add the bill, choose a split mode — done in 30 seconds.</p>
        <div className="home-final-cta__actions">
          <Link href="/circles" className="btn btn--primary btn--lg">Open my Circles</Link>
          <Link href="/circles/new" className="btn btn--outline btn--lg">+ Start a new Circle</Link>
          <Link href="/help" className="btn btn--ghost btn--lg">Need help?</Link>
        </div>
      </Reveal>
    </AppShell>
  );
}
