import { AppShell } from '@/components/layout/AppShell';
import { getPublicSettings, settingArray, settingString } from '@/lib/cms';
import { FaqAccordion } from '@/components/cms/FaqAccordion';
import Link from 'next/link';

interface FeatureCard { title: string; body: string }

export default async function HomePage(): Promise<JSX.Element> {
  const settings = await getPublicSettings();
  const features = settingArray<FeatureCard>(settings, 'feature.cards');
  return (
    <AppShell>
      {/* ─── Hero Section ─── */}
      <section className="hero fade-in-up">
        <div className="hero__badge">Expense Splitting Platform</div>
        <h1>{settingString(settings, 'hero.title', 'Money clarity for groups.')}</h1>
        <p className="hero__subtitle">
          {settingString(
            settings,
            'hero.subtitle',
            'Split bills, track balances, and settle debts with friends, roommates, travel buddies, and teams — all in one place, all in real-time, with zero confusion and zero cost.'
          )}
        </p>
        <div className="hero__actions">
          <Link href={settingString(settings, 'cta.primary.href', '/register')} className="btn btn--primary btn--lg">
            {settingString(settings, 'cta.primary.label', 'Get started — It\'s free')}
          </Link>
          <Link href="/login" className="btn btn--outline btn--lg">
            Sign in
          </Link>
          <Link href="#how-it-works" className="btn btn--ghost btn--lg">
            See how it works
          </Link>
        </div>
        <p className="hero__trust-line">No credit card required · Free for personal use · Real-time sync across all devices</p>
      </section>

      {/* ─── Problem Statement ─── */}
      <section className="landing-section container fade-in-up" id="why">
        <div className="section-header">
          <span className="section-label">The Problem</span>
          <h2>Splitting expenses shouldn&apos;t be this hard.</h2>
          <p className="section-desc">
            Whether you&apos;re sharing rent with roommates, splitting dinner with friends, managing group travel costs, or tracking team expenses — keeping track of who owes whom becomes a messy, stressful nightmare. Spreadsheets get outdated. Mental math fails. Friendships suffer.
          </p>
        </div>
        <div className="problem-grid">
          <div className="problem-card">
            <div className="problem-card__icon">💸</div>
            <h4>Lost track of payments</h4>
            <p>&quot;Wait, did I already pay you back for groceries last week?&quot; — Sound familiar? Without a clear record, payments get forgotten or duplicated. Money slips through the cracks.</p>
          </div>
          <div className="problem-card">
            <div className="problem-card__icon">📱</div>
            <h4>Scattered conversations</h4>
            <p>Expense conversations scattered across WhatsApp, texts, notes apps, and memory. There&apos;s no single place everyone can check to see what&apos;s owed.</p>
          </div>
          <div className="problem-card">
            <div className="problem-card__icon">🧮</div>
            <h4>Unfair splits</h4>
            <p>Manually splitting bills leads to rounding issues, unfair distributions, and the awkward &quot;you owe me ₹3.50&quot; conversations that nobody enjoys.</p>
          </div>
          <div className="problem-card">
            <div className="problem-card__icon">😤</div>
            <h4>Settlement confusion</h4>
            <p>In groups of 5+, figuring out who should pay whom — and how much — becomes impossibly complicated. Arguments happen. Friendships get strained.</p>
          </div>
        </div>
      </section>

      {/* ─── Solution / What is BuddySplit ─── */}
      <section className="landing-section landing-section--accent" id="solution">
        <div className="container">
          <div className="section-header">
            <span className="section-label">The Solution</span>
            <h2>Meet IWX BuddySplit — Split Smart.</h2>
            <p className="section-desc">
              BuddySplit is a smart expense management platform designed for the way groups actually share money. It handles precise calculations down to every single paisa, figures out the simplest way to settle all debts, and keeps everyone on the same page in real-time — so you can focus on enjoying time with your group, not arguing about money.
            </p>
          </div>
          <div className="solution-highlights">
            <div className="highlight-card">
              <h3>🎯 Down to Every Paisa</h3>
              <p>No rounding errors. No &quot;close enough.&quot; BuddySplit calculates splits with absolute precision. When ₹100 is split among 3 people, you get ₹34 + ₹33 + ₹33 — not ₹33.33 repeated. Every paisa is accounted for, always.</p>
            </div>
            <div className="highlight-card">
              <h3>⚡ Live Collaboration</h3>
              <p>When someone adds an expense, everyone in the group sees it instantly. No refreshing, no &quot;did you get my update?&quot; texts. Your group always has the latest picture of who owes what.</p>
            </div>
            <div className="highlight-card">
              <h3>🧠 Smart Settlements</h3>
              <p>Instead of everyone paying everyone else back separately, BuddySplit calculates the minimum number of payments needed to settle all debts. A group of 10? Settled in at most 9 simple transfers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="landing-section container" id="features">
        <div className="section-header">
          <span className="section-label">Features</span>
          <h2>Everything you need for group expenses.</h2>
          <p className="section-desc">
            From a simple dinner split to managing months of shared rent — BuddySplit has every tool your group needs to track, split, and settle expenses without stress.
          </p>
        </div>
        <div className="feature-grid feature-grid--detailed">
          <div className="card card--hover feature-card-detail">
            <div className="feature-card-detail__icon">🔄</div>
            <h3 className="card__title">5 Ways to Split</h3>
            <p className="text-secondary">Split equally, by exact amounts, by percentage, by custom ratios, or with per-person adjustments. No matter how your group shares costs, there&apos;s a mode that fits perfectly.</p>
          </div>
          <div className="card card--hover feature-card-detail">
            <div className="feature-card-detail__icon">👥</div>
            <h3 className="card__title">Circles for Every Group</h3>
            <p className="text-secondary">Create separate circles for roommates, trips, couples, office teams — anything. Each circle keeps its own expenses, balances, and settlements completely organized.</p>
          </div>
          <div className="card card--hover feature-card-detail">
            <div className="feature-card-detail__icon">📊</div>
            <h3 className="card__title">Live Balances & Reports</h3>
            <p className="text-secondary">See who owes whom at a glance. Get detailed breakdowns per person, per expense, and per time period. Full transparency means fewer arguments.</p>
          </div>
          <div className="card card--hover feature-card-detail">
            <div className="feature-card-detail__icon">💳</div>
            <h3 className="card__title">Partial Settlements</h3>
            <p className="text-secondary">Can&apos;t pay the full amount right now? No problem. Record what you can pay. BuddySplit automatically recalculates everyone&apos;s remaining balance.</p>
          </div>
          <div className="card card--hover feature-card-detail">
            <div className="feature-card-detail__icon">🔔</div>
            <h3 className="card__title">Smart Notifications</h3>
            <p className="text-secondary">Get notified instantly when expenses are added, when settlements are recorded, and when friends invite you. Never miss an update — in-app and via email.</p>
          </div>
          <div className="card card--hover feature-card-detail">
            <div className="feature-card-detail__icon">✉️</div>
            <h3 className="card__title">One-Click Invitations</h3>
            <p className="text-secondary">Invite friends to your circle via email. They get a secure link and can join with a single click — even if they don&apos;t have an account yet. Onboarding is effortless.</p>
          </div>
          <div className="card card--hover feature-card-detail">
            <div className="feature-card-detail__icon">🛡️</div>
            <h3 className="card__title">Roles & Permissions</h3>
            <p className="text-secondary">Set who can add expenses, who can record settlements, and who manages the circle. Owners, admins, and members each have appropriate access levels.</p>
          </div>
          <div className="card card--hover feature-card-detail">
            <div className="feature-card-detail__icon">📱</div>
            <h3 className="card__title">Works Everywhere</h3>
            <p className="text-secondary">Desktop, tablet, or phone — BuddySplit looks great and works flawlessly on any device. Add expenses on the go, check balances from anywhere.</p>
          </div>
          <div className="card card--hover feature-card-detail">
            <div className="feature-card-detail__icon">🔒</div>
            <h3 className="card__title">Your Data Stays Yours</h3>
            <p className="text-secondary">No ads. No data selling. No third-party trackers. Your financial information is private, protected, and never shared with anyone. Period.</p>
          </div>
        </div>

        {features.length > 0 && (
          <div className="feature-grid" style={{ marginTop: '2rem' }}>
            {features.map((f, i) => (
              <div key={i} className="card card--hover">
                <h3 className="card__title">{f.title}</h3>
                <p className="text-secondary">{f.body}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── How It Works ─── */}
      <section className="landing-section landing-section--dark" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-label">How It Works</span>
            <h2>Get started in 4 simple steps.</h2>
            <p className="section-desc">From sign-up to fully settled — here&apos;s how easy it is.</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-card__number">01</div>
              <h3>Create your account</h3>
              <p>Sign up with just your email address. Verify with a quick code sent to your inbox, choose a display name, and you&apos;re in. Takes less than a minute.</p>
            </div>
            <div className="step-card">
              <div className="step-card__number">02</div>
              <h3>Create a Circle</h3>
              <p>A Circle is your shared space with a group. Create one for your flat, your upcoming trip, your lunch group — whatever. Name it, pick your currency, and invite your people via email.</p>
            </div>
            <div className="step-card">
              <div className="step-card__number">03</div>
              <h3>Add expenses as they happen</h3>
              <p>Bought groceries? Paid for the cab? Covered dinner? Add the expense, select who paid, choose how to split it, and everyone sees the update instantly on their screen.</p>
            </div>
            <div className="step-card">
              <div className="step-card__number">04</div>
              <h3>Settle up with ease</h3>
              <p>When it&apos;s time to settle, BuddySplit shows you exactly who should pay whom — using the fewest transfers possible. Record payments as they happen. Done. No confusion.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Split Modes ─── */}
      <section className="landing-section container" id="split-modes">
        <div className="section-header">
          <span className="section-label">Flexible Splitting</span>
          <h2>Five ways to split. Every paisa accounted for.</h2>
          <p className="section-desc">
            No matter how your group prefers to share costs, BuddySplit has the right split mode. Every calculation is precise — no rounding issues, no missing money.
          </p>
        </div>
        <div className="split-modes-list">
          <div className="split-mode-item">
            <div className="split-mode-item__header">
              <span className="split-mode-item__tag">Equal</span>
              <h3>Split Equally</h3>
            </div>
            <p>The classic split — divide the total evenly among everyone. When the math doesn&apos;t divide perfectly (like ₹100 among 3 people), BuddySplit distributes the extra paise fairly so the total always adds up exactly. No one gets shortchanged.</p>
          </div>
          <div className="split-mode-item">
            <div className="split-mode-item__header">
              <span className="split-mode-item__tag">Exact</span>
              <h3>Split by Exact Amounts</h3>
            </div>
            <p>Already agreed on who pays what? Enter exact amounts for each person. BuddySplit verifies everything adds up to the total — no more, no less. Perfect for &quot;I&apos;ll cover ₹500, you get the rest&quot; situations.</p>
          </div>
          <div className="split-mode-item">
            <div className="split-mode-item__header">
              <span className="split-mode-item__tag">Percentage</span>
              <h3>Split by Percentage</h3>
            </div>
            <p>Assign percentage shares to each person. Great for income-proportional splits between partners or housemates. The percentages must add up to 100%, and the resulting amounts sum to the bill exactly.</p>
          </div>
          <div className="split-mode-item">
            <div className="split-mode-item__header">
              <span className="split-mode-item__tag">Shares</span>
              <h3>Split by Shares (Ratio)</h3>
            </div>
            <p>Assign weight-based shares to each person. If Priya has 2 shares and Manoj has 1 share, Priya pays 2/3 and Manoj pays 1/3. Works for any ratio — 3:2:1, 5:5:3, or whatever your group decides.</p>
          </div>
          <div className="split-mode-item">
            <div className="split-mode-item__header">
              <span className="split-mode-item__tag">Adjustment</span>
              <h3>Split with Adjustments</h3>
            </div>
            <p>Start with an equal split, then tweak individual amounts. &quot;Split equally, but Amit pays ₹50 extra because he ordered the expensive dish.&quot; Real-world flexibility built right in.</p>
          </div>
        </div>
      </section>

      {/* ─── Smart Settlements ─── */}
      <section className="landing-section landing-section--accent" id="settlements">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Smart Settlements</span>
            <h2>Fewest payments. Zero confusion.</h2>
            <p className="section-desc">
              When it&apos;s time to settle up, BuddySplit figures out the simplest way to clear all debts — so your group makes as few payments as possible.
            </p>
          </div>
          <div className="settlement-explainer">
            <div className="settlement-explainer__example">
              <h4>Example: A weekend trip with 4 friends</h4>
              <div className="settlement-explainer__scenario">
                <p><strong>After all the trip expenses are logged:</strong></p>
                <ul>
                  <li>Priya is owed ₹500 (she paid for most things)</li>
                  <li>Manoj owes ₹200</li>
                  <li>Bindu owes ₹150</li>
                  <li>Amit owes ₹150</li>
                </ul>
                <p><strong>Without BuddySplit:</strong> Confusion — who pays whom? Multiple back-and-forth transfers.</p>
                <p><strong>With BuddySplit:</strong> Just 3 clean transfers:</p>
                <ul>
                  <li>Manoj → Priya: ₹200</li>
                  <li>Bindu → Priya: ₹150</li>
                  <li>Amit → Priya: ₹150</li>
                </ul>
                <p>Everyone knows exactly what to do. Done in minutes.</p>
              </div>
            </div>
            <div className="settlement-explainer__features">
              <div className="settlement-feature">
                <h4>⚡ Minimum Transfers</h4>
                <p>BuddySplit automatically finds the payment plan with the fewest possible transfers. Less confusion, faster settlement, happier friends.</p>
              </div>
              <div className="settlement-feature">
                <h4>💰 Pay What You Can</h4>
                <p>Can&apos;t pay the full suggested amount right now? Record a partial payment. BuddySplit recalculates the remaining balances automatically. No pressure.</p>
              </div>
              <div className="settlement-feature">
                <h4>✅ Always Accurate</h4>
                <p>Every calculation is precise and consistent. The same expenses always produce the same settlement plan. No surprises, no discrepancies.</p>
              </div>
              <div className="settlement-feature">
                <h4>📋 Complete History</h4>
                <p>Every settlement is recorded with who paid, how much, and when. Full payment history gives everyone confidence that accounts are square.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Use Cases ─── */}
      <section className="landing-section landing-section--dark" id="use-cases">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Use Cases</span>
            <h2>Built for every shared-money scenario.</h2>
            <p className="section-desc">
              Whether it&apos;s two people or twenty, one-time or ongoing — BuddySplit adapts to your situation. Here are some of the most popular ways people use it.
            </p>
          </div>
          <div className="use-cases-grid">
            <div className="use-case-card">
              <div className="use-case-card__emoji">🏠</div>
              <h3>Roommates & Shared Living</h3>
              <p>Track rent, utilities, groceries, cleaning supplies, and shared subscriptions month after month. Set up monthly settlement cycles to keep things tidy. When someone moves out, pause or close the circle — balances are preserved forever.</p>
            </div>
            <div className="use-case-card">
              <div className="use-case-card__emoji">✈️</div>
              <h3>Travel & Trips</h3>
              <p>Group trips create dozens of shared costs — hotels, flights, meals, activities, transport, tips. Add them on the go from your phone. At the end of the trip, settle everything with minimum transfers. Complete the circle to lock in the final record.</p>
            </div>
            <div className="use-case-card">
              <div className="use-case-card__emoji">🍕</div>
              <h3>Dinner & Social Groups</h3>
              <p>Your regular friend group that goes out every weekend? Create a circle and track bills over time. Split by equal or percentage based on what each person ordered. See running totals across dozens of outings.</p>
            </div>
            <div className="use-case-card">
              <div className="use-case-card__emoji">💼</div>
              <h3>Office & Team Expenses</h3>
              <p>Team lunches, office supplies, shared tools, conference tickets. Give managers admin access to oversee all expenses, while team members add their own. Export the complete activity log for company reimbursement.</p>
            </div>
            <div className="use-case-card">
              <div className="use-case-card__emoji">💑</div>
              <h3>Couples & Partners</h3>
              <p>Track shared household expenses between partners with full transparency. Split proportionally based on income using ratio mode. Both partners always know exactly who&apos;s contributing what — eliminating money-related stress.</p>
            </div>
            <div className="use-case-card">
              <div className="use-case-card__emoji">🎉</div>
              <h3>Events & Celebrations</h3>
              <p>Organizing a birthday party, pooling money for a wedding gift, or managing a group holiday celebration? Create a circle, track everyone&apos;s contributions and expenses, then settle the difference fairly at the end.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Circle Lifecycle ─── */}
      <section className="landing-section container" id="lifecycle">
        <div className="section-header">
          <span className="section-label">Circle Management</span>
          <h2>Full control over your group&apos;s lifecycle.</h2>
          <p className="section-desc">
            Circles aren&apos;t just expense containers — they grow with your group. Whether your trip ended, a roommate moved out, or you need to start fresh, BuddySplit gives you full control.
          </p>
        </div>
        <div className="feature-grid feature-grid--detailed">
          <div className="card card--hover feature-card-detail">
            <div className="feature-card-detail__icon">▶️</div>
            <h3 className="card__title">Active</h3>
            <p className="text-secondary">The default state. Everyone can add expenses, record settlements, and track balances. Perfect for ongoing shared living, regular friend groups, or active trips.</p>
          </div>
          <div className="card card--hover feature-card-detail">
            <div className="feature-card-detail__icon">⏸️</div>
            <h3 className="card__title">Paused</h3>
            <p className="text-secondary">Temporarily freeze the circle. No new expenses can be added, but everyone can still view balances and history. Useful when a roommate is travelling or the group is on break.</p>
          </div>
          <div className="card card--hover feature-card-detail">
            <div className="feature-card-detail__icon">✅</div>
            <h3 className="card__title">Completed</h3>
            <p className="text-secondary">Mark the circle as done. All balances are locked in a permanent snapshot. The trip is over, everyone settled — now you have a clean, final record that never changes.</p>
          </div>
          <div className="card card--hover feature-card-detail">
            <div className="feature-card-detail__icon">📦</div>
            <h3 className="card__title">Archived</h3>
            <p className="text-secondary">Move old circles out of your main view. They&apos;re still accessible anytime you need to look back, but won&apos;t clutter your active dashboard.</p>
          </div>
          <div className="card card--hover feature-card-detail">
            <div className="feature-card-detail__icon">🔄</div>
            <h3 className="card__title">Reopened</h3>
            <p className="text-secondary">Need to add more expenses after completing? Reopen the circle into a fresh period. Previous records stay frozen and immutable — new expenses start clean.</p>
          </div>
          <div className="card card--hover feature-card-detail">
            <div className="feature-card-detail__icon">👋</div>
            <h3 className="card__title">Members Leave & Join</h3>
            <p className="text-secondary">People come and go. Members can leave a circle, and new ones can join mid-way. Past expenses stay accurately attributed. Balances always reflect reality.</p>
          </div>
        </div>
      </section>

      {/* ─── Why Choose BuddySplit ─── */}
      <section className="landing-section landing-section--accent" id="why-us">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Why BuddySplit</span>
            <h2>What makes us different.</h2>
            <p className="section-desc">
              There are other expense-splitting apps out there. Here&apos;s why BuddySplit stands apart.
            </p>
          </div>
          <div className="use-cases-grid">
            <div className="use-case-card">
              <div className="use-case-card__emoji">💯</div>
              <h3>100% Free, No Catches</h3>
              <p>No premium plans. No &quot;upgrade to unlock.&quot; No ads. Every single feature is available to every user from day one. We believe managing shared money shouldn&apos;t cost you money.</p>
            </div>
            <div className="use-case-card">
              <div className="use-case-card__emoji">🎯</div>
              <h3>Mathematically Precise</h3>
              <p>Other apps round off and lose track of small amounts. BuddySplit accounts for every single paisa. ₹100 split 3 ways? You get ₹34 + ₹33 + ₹33 = ₹100 exactly. Not ₹99.99.</p>
            </div>
            <div className="use-case-card">
              <div className="use-case-card__emoji">⚡</div>
              <h3>Instant Real-Time Updates</h3>
              <p>No &quot;pull to refresh.&quot; No waiting. When any group member adds an expense or records a payment, everyone sees it immediately on their device. Always in sync.</p>
            </div>
            <div className="use-case-card">
              <div className="use-case-card__emoji">🔒</div>
              <h3>Private & Secure</h3>
              <p>Your expense data is never sold, shared, or used for advertising. No third-party trackers. No data mining. What happens in your circle stays in your circle.</p>
            </div>
            <div className="use-case-card">
              <div className="use-case-card__emoji">🧠</div>
              <h3>Smart Debt Simplification</h3>
              <p>Instead of 10 people each paying each other back, BuddySplit finds the minimum number of payments to clear all debts. Fewer transfers = less confusion = faster settlement.</p>
            </div>
            <div className="use-case-card">
              <div className="use-case-card__emoji">🌏</div>
              <h3>Any Currency, Any Group Size</h3>
              <p>Whether you&apos;re splitting in INR, USD, EUR, or any other currency — BuddySplit handles it. Works for couples, friend groups of 5, or large teams of 20+.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Roadmap ─── */}
      <section className="landing-section container" id="roadmap">
        <div className="section-header">
          <span className="section-label">Coming Soon</span>
          <h2>We&apos;re just getting started.</h2>
          <p className="section-desc">
            BuddySplit is actively growing. Here&apos;s what&apos;s already live and what&apos;s coming in future updates.
          </p>
        </div>
        <div className="roadmap-timeline">
          <div className="roadmap-phase roadmap-phase--done">
            <div className="roadmap-phase__marker">✓</div>
            <div className="roadmap-phase__content">
              <h4>Now Available <span className="pill pill--positive">Live</span></h4>
              <p>Circles, members with roles, all 5 split modes, smart settlement with minimum transfers, partial payments, email invitations, real-time updates, notifications, activity history, and admin controls.</p>
            </div>
          </div>
          <div className="roadmap-phase">
            <div className="roadmap-phase__marker">2</div>
            <div className="roadmap-phase__content">
              <h4>Coming Next — Enhanced Experience</h4>
              <p>Receipt photo uploads, detailed activity timeline, advanced search and filters, CSV/PDF export for records, and personal spending analytics with visual charts.</p>
            </div>
          </div>
          <div className="roadmap-phase">
            <div className="roadmap-phase__marker">3</div>
            <div className="roadmap-phase__content">
              <h4>Future — Advanced Features</h4>
              <p>Recurring expenses (auto-generated monthly bills), budgets and spending limits, multi-currency support with automatic conversion, and shared subscriptions tracking.</p>
            </div>
          </div>
          <div className="roadmap-phase">
            <div className="roadmap-phase__marker">4</div>
            <div className="roadmap-phase__content">
              <h4>Vision — Intelligent Finance</h4>
              <p>AI-powered spending insights, receipt scanning with automatic data entry, tax-friendly invoice generation, and smart recommendations to help your group save money.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="landing-section landing-section--dark" id="faq">
        <div className="container">
          <div className="section-header">
            <span className="section-label">FAQ</span>
            <h2>Frequently asked questions.</h2>
          </div>
          <FaqAccordion items={[
            {
              question: 'Is IWX BuddySplit really free?',
              answer: 'Yes — completely free for personal use. There are no premium tiers, no hidden fees, no feature gates, and no advertisements. Every feature is available to everyone from the start.',
            },
            {
              question: 'How is BuddySplit different from other expense apps?',
              answer: 'BuddySplit is precision-focused — it accounts for every paisa without rounding errors. It also calculates the mathematically optimal settlement plan (fewest transfers), updates in real-time so everyone is always in sync, and never sells your data.',
            },
            {
              question: 'What currencies are supported?',
              answer: 'You can create a circle in any currency — INR, USD, EUR, GBP, AUD, and 150+ others. Each circle operates in one currency. Multi-currency conversion between circles is coming in a future update.',
            },
            {
              question: 'Can I use this for my office or team?',
              answer: 'Absolutely. Create a circle for your team, assign admin roles to managers, and let everyone add expenses. Activity logs can be exported for company reimbursement. Great for team lunches, shared supplies, and event budgets.',
            },
            {
              question: "What happens when someone can't pay the full amount?",
              answer: 'No problem — BuddySplit supports partial payments. Record what they can pay now, and the system automatically recalculates the remaining balance. No awkwardness, no manual math.',
            },
            {
              question: 'What happens when a circle is completed?',
              answer: "Completing a circle freezes all balances and creates a permanent record. No more changes. It's your group's clean, final statement. If needed later, you can reopen it into a fresh period without losing the original record.",
            },
            {
              question: 'Is my financial data private?',
              answer: 'Yes. We never share, sell, or mine your data. There are no ads, no trackers, and no third-party analytics watching your spending. Your circles and expenses are visible only to their members.',
            },
            {
              question: 'How many people can be in a circle?',
              answer: "There's no hard limit. BuddySplit works great for couples (2 people), friend groups (5–10), and larger teams (20+). The smart settlement engine scales to any group size.",
            },
            {
              question: 'Can I be in multiple circles at once?',
              answer: 'Yes! Most people are. You might have one circle for roommates, another for a trip, and a third for your office lunch group. Each stays completely separate and organized.',
            },
            {
              question: 'Do all members need an account?',
              answer: 'Members need an account to view and add expenses. But inviting is effortless — send them an email invite and they can sign up and join your circle with a single click.',
            },
          ]} />
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="landing-section landing-section--cta">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>Ready to stop arguing about money?</h2>
          <p className="section-desc" style={{ marginBottom: '2rem' }}>
            Join thousands of groups who split smarter with BuddySplit. Free forever. No credit card needed.
          </p>
          <div className="hero__actions">
            <Link href="/register" className="btn btn--primary btn--lg">
              Create your free account
            </Link>
            <Link href="/login" className="btn btn--outline btn--lg">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
