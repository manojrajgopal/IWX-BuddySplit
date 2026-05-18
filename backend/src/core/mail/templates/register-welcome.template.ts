/**
 * Welcome email — sent immediately after a user successfully completes
 * registration (either OTP-verified email/password OR Google sign-up).
 *
 * Variables:
 *   {{displayName}}     — User's display name
 *   {{email}}           — User's email address
 *   {{signUpMethod}}    — e.g. "Email + Password" or "Google account"
 *   {{accountCreatedAt}}— Human-friendly created date ("18 May 2026, 3:42 PM IST")
 *   {{ipAddress}}       — IP of the device used to register
 *   {{userAgent}}       — Browser / device of the device used to register
 *   {{location}}        — Optional rough location ("India" or "Unknown")
 *   {{webUrl}}          — Public site URL
 */

import {
  renderBaseLayout, heading, subheading, divider, button,
  calloutBox, infoRow, infoTable, paragraph, sectionHeading, FONT_STACK,
} from './base-layout';

const body = `
${heading('Welcome to {{appName}}, {{displayName}}! 🎉')}
${subheading('Your account is ready. Let\'s help your group split smarter, together.')}

${paragraph('Hi <strong>{{displayName}}</strong>,')}

${paragraph('Welcome aboard! Your <strong>{{appName}}</strong> account has been created successfully and your email <strong>{{email}}</strong> is verified. You\'re now part of a community that values fairness, transparency and zero awkwardness around money.')}

${calloutBox(`
  <strong style="display:block;margin-bottom:6px;color:#111;">What is {{appName}}?</strong>
  <span style="color:#555;">
    A precision expense-splitter built for friends, roommates, travel groups, couples and teams.
    Every paisa is tracked. Every settlement is calculated with the fewest possible transfers.
    Real-time sync keeps your whole group on the same page — without spreadsheets, awkward
    reminders, or mental math.
  </span>
`)}

${sectionHeading('🆔 Your account details')}
${infoTable(`
  ${infoRow('Display name', '{{displayName}}')}
  ${infoRow('Email address', '{{email}}')}
  ${infoRow('Sign-up method', '{{signUpMethod}}')}
  ${infoRow('Account created', '{{accountCreatedAt}}')}
  ${infoRow('Created from', '{{ipAddress}} · {{location}}')}
  ${infoRow('Device / browser', '{{userAgent}}')}
`)}

${sectionHeading('🚀 Get started in 4 quick steps')}
<ol style="margin:0 0 20px;padding-left:22px;color:#333;font-size:15px;font-family:${FONT_STACK};line-height:1.8;">
  <li><strong>Create your first Circle</strong> — a Circle is a shared space for a specific group (your flat, your trip, your dinner crew). Name it, pick a currency, done.</li>
  <li><strong>Invite your people</strong> — drop in their email addresses. They get a secure link and can join with a single click.</li>
  <li><strong>Log expenses as they happen</strong> — bought groceries, paid the cab, covered dinner? Add it, pick who paid, and choose how to split.</li>
  <li><strong>Settle up with zero confusion</strong> — when it\'s time to clear balances, {{appName}} shows the fewest transfers needed. Record them, and you\'re done.</li>
</ol>

${button('Open my dashboard', '{{webUrl}}/dashboard')}

${sectionHeading('💡 The 5 ways you can split a bill')}
<ul style="margin:0 0 20px;padding-left:22px;color:#333;font-size:15px;font-family:${FONT_STACK};line-height:1.75;">
  <li><strong>Equal</strong> — the classic. Extra paise distributed fairly so totals always match.</li>
  <li><strong>Exact</strong> — enter specific amounts per person. Great for "I paid ₹500, you handle the rest".</li>
  <li><strong>Percentage</strong> — assign %. Perfect for proportional splits between partners.</li>
  <li><strong>Shares (ratio)</strong> — weight-based, like 2:1 or 3:2:1. Flexible for any group.</li>
  <li><strong>Adjustment</strong> — equal split, then nudge individuals up or down a little.</li>
</ul>

${sectionHeading('🔒 Your security & privacy')}
${paragraph('We take this seriously:')}
<ul style="margin:0 0 20px;padding-left:22px;color:#333;font-size:15px;font-family:${FONT_STACK};line-height:1.7;">
  <li>Your password is <strong>hashed using Argon2id</strong> — even our engineers can\'t read it.</li>
  <li>All connections are <strong>TLS-encrypted</strong>.</li>
  <li>Your financial data is <strong>never sold</strong>, never shared with advertisers, and never used to train AI models.</li>
  <li>You can <strong>export or delete</strong> your data anytime from Settings → Privacy.</li>
</ul>

${calloutBox(`
  <strong style="display:block;margin-bottom:6px;color:#111;">📲 Tip — bookmark your dashboard</strong>
  <span style="color:#555;">
    {{appName}} works beautifully on desktop, tablet and mobile. Add
    <a href="{{webUrl}}/dashboard" style="color:#111;text-decoration:underline;">{{webUrl}}/dashboard</a>
    to your home screen for one-tap access from anywhere.
  </span>
`)}

${divider()}

${sectionHeading('⚠️ Didn\'t sign up?')}
${paragraph('If you didn\'t create this account, someone may have entered your email by mistake. Please <a href="{{webUrl}}/forgot-password" style="color:#111;text-decoration:underline;">reset your password immediately</a> or <a href="mailto:support@infinitewavex.com" style="color:#111;text-decoration:underline;">contact our support team</a> and we\'ll help you secure your account.')}

${divider()}

<p class="em-muted" style="margin:0;font-size:13px;color:#888;font-family:${FONT_STACK};line-height:1.55;">
  Need help getting started? Just reply to this email or visit our
  <a href="{{webUrl}}/help" style="color:#555;text-decoration:underline;">help center</a> — real humans, fast responses.
</p>
<p class="em-muted" style="margin:8px 0 0;font-size:13px;color:#888;font-family:${FONT_STACK};line-height:1.55;">
  Welcome aboard,<br/>The {{appName}} team
</p>
`;

export const registerWelcomeTemplate = {
  subject: 'Welcome to {{appName}}, {{displayName}} — your account is ready 🎉',
  html: renderBaseLayout({
    preheader: 'Your {{appName}} account is ready. Here\'s everything you need to get started.',
    body,
  }),
};
