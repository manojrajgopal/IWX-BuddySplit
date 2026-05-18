/**
 * Invitation email template — sent when a user is invited to a circle.
 *
 * Variables (per send):
 *   {{inviterName}}    — Who sent the invite
 *   {{workspaceName}}  — Circle name
 *   {{role}}           — Member role (Owner, Admin, Editor, Viewer)
 *   {{acceptUrl}}      — Invitation accept link
 *   {{expiresIn}}      — Human-readable expiry (e.g. "7 days")
 */

import {
  renderBaseLayout, heading, subheading, divider, button,
  infoRow, infoTable, calloutBox, FONT_STACK,
} from './base-layout';

const body = `
${heading('You\'re invited!')}
${subheading('Join a new circle on {{appName}}')}

<p class="em-text" style="margin:0 0 16px;font-size:15px;color:#333;font-family:${FONT_STACK};line-height:1.65;">
  <strong>{{inviterName}}</strong> has invited you to join the circle <strong>"{{workspaceName}}"</strong>.
</p>

<p class="em-text" style="margin:0 0 20px;font-size:15px;color:#333;font-family:${FONT_STACK};line-height:1.65;">
  Once you join, you'll be able to track shared expenses, see who owes what at a glance, and settle up with the fewest possible transfers.
</p>

${infoTable(
  infoRow('Circle', '<strong>{{workspaceName}}</strong>') +
  infoRow('Invited by', '{{inviterName}}') +
  infoRow('Your role', '{{role}}') +
  infoRow('Expires in', '{{expiresIn}}')
)}

${button('Accept Invitation', '{{acceptUrl}}')}

${calloutBox(`
  <strong style="display:block;margin-bottom:6px;color:#111;">What happens next?</strong>
  <span style="color:#555;">After accepting, you'll be added to the circle immediately. You can start adding expenses, viewing splits, and settling balances right away.</span>
`)}

${divider()}

<p class="em-muted" style="margin:0;font-size:13px;color:#999;font-family:${FONT_STACK};line-height:1.5;">
  If you don't recognize this invitation or don't know <strong>{{inviterName}}</strong>, you can safely ignore this email.
</p>
`;

export const inviteTemplate = {
  subject: '{{inviterName}} invited you to "{{workspaceName}}" — {{appName}}',
  html: renderBaseLayout({
    preheader: '{{inviterName}} invited you to join "{{workspaceName}}" on {{appName}}.',
    body,
  }),
};
