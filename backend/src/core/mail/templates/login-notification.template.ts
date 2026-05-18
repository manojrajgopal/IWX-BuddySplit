/**
 * Login notification email — sent every time a user signs in successfully.
 * Provides a full security audit so the user can detect unauthorized access.
 *
 * Variables:
 *   {{displayName}}     — User's display name
 *   {{email}}           — User's email address
 *   {{signInMethod}}    — "Email + Password" or "Google account"
 *   {{signInAt}}        — Human-friendly timestamp ("18 May 2026, 3:42 PM IST")
 *   {{ipAddress}}       — IP of the signing-in device
 *   {{userAgent}}       — Browser / device string
 *   {{location}}        — Optional rough location ("India" / "Unknown")
 *   {{deviceLabel}}     — Parsed device label ("Chrome on Windows")
 *   {{isNewDevice}}     — "yes" / "no" (currently always "no" until device-fingerprint feature lands)
 *   {{webUrl}}          — Public site URL
 */

import {
  renderBaseLayout, heading, subheading, divider, button,
  calloutBox, infoRow, infoTable, paragraph, sectionHeading, FONT_STACK,
} from './base-layout';

const body = `
${heading('New sign-in to your account')}
${subheading('Hi {{displayName}}, we noticed a sign-in to your {{appName}} account. If this was you, no action is needed.')}

${paragraph('Hello <strong>{{displayName}}</strong>,')}

${paragraph('We\'re sending you this notification because someone just signed in to your <strong>{{appName}}</strong> account (<a href="mailto:{{email}}" style="color:#111;text-decoration:underline;">{{email}}</a>). Here are the full details so you can confirm it was you:')}

${sectionHeading('🔐 Sign-in details')}
${infoTable(`
  ${infoRow('Account', '{{email}}')}
  ${infoRow('Method', '{{signInMethod}}')}
  ${infoRow('Time', '{{signInAt}}')}
  ${infoRow('Device', '{{deviceLabel}}')}
  ${infoRow('Browser / agent', '{{userAgent}}')}
  ${infoRow('IP address', '{{ipAddress}}')}
  ${infoRow('Approx. location', '{{location}}')}
`)}

${calloutBox(`
  <strong style="display:block;margin-bottom:6px;color:#111;">✅ Was this you?</strong>
  <span style="color:#555;">
    If yes — perfect, nothing more to do. You can safely ignore this email or
    archive it. We send these notifications every time so you always know
    what\'s happening with your account.
  </span>
`)}

${sectionHeading('🚨 Wasn\'t you?')}
${paragraph('If you don\'t recognize this sign-in, your account may be at risk. Please act quickly:')}
<ol style="margin:0 0 20px;padding-left:22px;color:#333;font-size:15px;font-family:${FONT_STACK};line-height:1.8;">
  <li><strong>Reset your password right now</strong> using the button below — this signs everyone out of every device.</li>
  <li><strong>Review your active sessions</strong> from Settings → Security → Sessions and revoke anything unfamiliar.</li>
  <li><strong>Check the email recovery address</strong> on your account hasn\'t been changed.</li>
  <li><strong>Contact our security team</strong> at <a href="mailto:security@infinitewavex.com" style="color:#111;text-decoration:underline;">security@infinitewavex.com</a> — we respond fast to suspicious activity reports.</li>
</ol>

${button('Secure my account now', '{{webUrl}}/forgot-password')}

${divider()}

${sectionHeading('🛡️ How we keep you safe')}
<ul style="margin:0 0 20px;padding-left:22px;color:#333;font-size:15px;font-family:${FONT_STACK};line-height:1.7;">
  <li>Your password is hashed with <strong>Argon2id</strong> — never stored in readable form.</li>
  <li>All sign-in tokens use <strong>short-lived JWTs</strong> with secure refresh-token rotation.</li>
  <li>Sessions can be revoked instantly from Settings → Security.</li>
  <li>We never ask for your password by email, chat or phone. <strong>If anyone does, it\'s a scam.</strong></li>
</ul>

${calloutBox(`
  <strong style="display:block;margin-bottom:6px;color:#111;">🔔 Want fewer of these emails?</strong>
  <span style="color:#555;">
    You can adjust your notification preferences anytime from
    <a href="{{webUrl}}/dashboard/settings/notifications" style="color:#111;text-decoration:underline;">Settings → Notifications</a>.
    We recommend keeping sign-in alerts on — they\'re your first line of defense.
  </span>
`)}

${divider()}

<p class="em-muted" style="margin:0;font-size:13px;color:#888;font-family:${FONT_STACK};line-height:1.55;">
  This is an automated security notification from {{appName}}. We send it on every successful sign-in so you always know what\'s happening with your account.
</p>
<p class="em-muted" style="margin:8px 0 0;font-size:13px;color:#888;font-family:${FONT_STACK};line-height:1.55;">
  Stay safe,<br/>The {{appName}} Security Team
</p>
`;

export const loginNotificationTemplate = {
  subject: 'New sign-in to your {{appName}} account · {{signInAt}}',
  html: renderBaseLayout({
    preheader: 'A new sign-in to your {{appName}} account just happened. Tap to review the details.',
    body,
  }),
};
