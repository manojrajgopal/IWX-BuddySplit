/**
 * Member joined email template — sent to existing circle members when someone new joins.
 *
 * Variables (per send):
 *   {{memberName}}     — Display name of new member
 *   {{memberEmail}}    — Email of new member
 *   {{memberInitial}}  — First letter of name (uppercase) for avatar
 *   {{workspaceName}}  — Circle name
 *   {{role}}           — Member role (Editor, Admin, etc.)
 *   {{joinedAt}}       — Formatted join timestamp
 *   {{memberCount}}    — Total active members after join
 *   {{circleUrl}}      — Link to view circle
 *   {{members}}        — Array<{ name, role, isNew }>
 */

import {
  renderBaseLayout, heading, subheading, sectionHeading, divider, button,
  infoRow, infoTable, FONT_STACK,
} from './base-layout';

const membersTable = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border:1px solid #eee;border-radius:12px;border-collapse:separate;overflow:hidden;">
  <tr class="em-tbl-hdr" style="background:#f8f8f8;">
    <td class="em-tbl-cell" style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#888;font-family:${FONT_STACK};">Member</td>
    <td class="em-tbl-cell" style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#888;font-family:${FONT_STACK};text-align:right;">Role</td>
  </tr>
  {{#each members}}
  <tr class="em-tbl-row" style="border-top:1px solid #eee;">
    <td class="em-tbl-cell em-text" style="padding:12px 16px;font-size:14px;color:#333;font-family:${FONT_STACK};border-top:1px solid #eee;">
      {{this.name}}{{#if this.isNew}} <span class="em-badge" style="display:inline-block;padding:2px 8px;background:#111;color:#fff;border-radius:5px;font-size:10px;font-weight:700;margin-left:6px;letter-spacing:0.5px;">NEW</span>{{/if}}
    </td>
    <td class="em-tbl-cell em-muted" style="padding:12px 16px;font-size:13px;color:#666;font-family:${FONT_STACK};text-align:right;border-top:1px solid #eee;">{{this.role}}</td>
  </tr>
  {{/each}}
</table>
`;

const body = `
${heading('New member joined!')}
${subheading('Your circle just got bigger')}

<!-- Member avatar card -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
  <tr>
    <td class="em-info-row" align="center" style="background:#f8f8f8;border-radius:14px;padding:28px 20px;">
      <div class="em-avatar" style="display:inline-block;width:72px;height:72px;border-radius:50%;background:#111;color:#fff;line-height:72px;text-align:center;font-size:30px;font-weight:700;font-family:${FONT_STACK};margin-bottom:14px;">{{memberInitial}}</div>
      <p class="em-h" style="margin:0 0 4px;font-size:20px;font-weight:700;color:#111;font-family:${FONT_STACK};letter-spacing:-0.3px;">{{memberName}}</p>
      <p class="em-muted" style="margin:0;font-size:13px;color:#888;font-family:${FONT_STACK};">{{memberEmail}}</p>
    </td>
  </tr>
</table>

${sectionHeading('Join details')}
${infoTable(
  infoRow('Circle', '<strong>{{workspaceName}}</strong>') +
  infoRow('Role assigned', '{{role}}') +
  infoRow('Joined at', '{{joinedAt}}') +
  infoRow('Total members', '<strong>{{memberCount}}</strong>')
)}

${divider()}

${sectionHeading('Current circle members')}
<p class="em-muted" style="margin:0 0 14px;font-size:13px;color:#777;font-family:${FONT_STACK};">Here's everyone in <strong>"{{workspaceName}}"</strong> right now:</p>
${membersTable}

${button('Open Circle', '{{circleUrl}}')}

${divider()}

<p class="em-muted" style="margin:0;text-align:center;font-size:13px;color:#999;font-family:${FONT_STACK};line-height:1.5;">
  You're receiving this because you're a member of <strong style="color:#666;">"{{workspaceName}}"</strong>.
</p>
`;

export const memberJoinedTemplate = {
  subject: '{{memberName}} joined "{{workspaceName}}" — {{appName}}',
  html: renderBaseLayout({
    preheader: '{{memberName}} just joined the circle "{{workspaceName}}". You now have {{memberCount}} members.',
    body,
  }),
};
