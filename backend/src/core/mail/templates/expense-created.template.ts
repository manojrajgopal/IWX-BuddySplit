/**
 * Expense created email template — sent to all circle members.
 *
 * Variables (per send):
 *   {{workspaceName}}      — Circle name
 *   {{description}}        — Expense description
 *   {{currency}}           — Currency code
 *   {{formattedAmount}}    — Formatted total (decimal string)
 *   {{payerName}}          — Who paid
 *   {{createdByName}}      — Who added the entry
 *   {{category}}           — Category label
 *   {{splitMode}}          — Split mode label
 *   {{occurredAt}}         — Formatted date
 *   {{notes}}              — Optional notes
 *   {{expenseUrl}}         — Link to view expense
 *   {{splits}}             — Array<{ memberName, formattedShare, isPayer }>
 *   {{suggestedTransfers}} — Array<{ from, to, formattedAmount }> for THIS expense
 *   {{overallTransfers}}   — Array<{ from, to, formattedAmount }> across the whole circle
 *   {{overallBalances}}    — Array<{ memberName, formattedPaid, formattedOwed, formattedNet, netSign }>
 *   {{hasOverall}}         — boolean; true when overall data is available
 */

import {
  renderBaseLayout, heading, subheading, sectionHeading, divider, button,
  infoRow, infoTable, calloutBox, FONT_STACK, MONO_STACK,
} from './base-layout';

const splitsTable = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border:1px solid #eee;border-radius:12px;border-collapse:separate;overflow:hidden;">
  <tr class="em-tbl-hdr" style="background:#f8f8f8;">
    <td class="em-tbl-cell" style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#888;font-family:${FONT_STACK};">Member</td>
    <td class="em-tbl-cell" style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#888;font-family:${FONT_STACK};text-align:right;">Share</td>
  </tr>
  {{#each splits}}
  <tr class="em-tbl-row" style="border-top:1px solid #eee;">
    <td class="em-tbl-cell em-text" style="padding:12px 16px;font-size:14px;color:#333;font-family:${FONT_STACK};border-top:1px solid #eee;">
      {{this.memberName}}{{#if this.isPayer}} <span class="em-badge" style="display:inline-block;padding:2px 8px;background:#111;color:#fff;border-radius:5px;font-size:10px;font-weight:700;margin-left:6px;letter-spacing:0.5px;">PAID</span>{{/if}}
    </td>
    <td class="em-tbl-cell em-text" style="padding:12px 16px;font-size:14px;color:#333;font-weight:600;font-family:${MONO_STACK};text-align:right;border-top:1px solid #eee;">{{../currency}} {{this.formattedShare}}</td>
  </tr>
  {{/each}}
</table>
`;

const transfersTable = (arrayName: string, accentBg: string) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border:1px solid #eee;border-radius:12px;border-collapse:separate;overflow:hidden;">
  <tr class="em-tbl-hdr" style="background:${accentBg};">
    <td class="em-tbl-cell" style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#888;font-family:${FONT_STACK};">From</td>
    <td class="em-tbl-cell" style="padding:12px 8px;font-size:11px;font-weight:700;color:#888;font-family:${FONT_STACK};text-align:center;"></td>
    <td class="em-tbl-cell" style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#888;font-family:${FONT_STACK};">To</td>
    <td class="em-tbl-cell" style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#888;font-family:${FONT_STACK};text-align:right;">Amount</td>
  </tr>
  {{#each ${arrayName}}}
  <tr class="em-tbl-row" style="border-top:1px solid #eee;">
    <td class="em-tbl-cell em-text" style="padding:14px 16px;font-size:14px;color:#333;font-family:${FONT_STACK};border-top:1px solid #eee;font-weight:500;">{{this.from}}</td>
    <td class="em-tbl-cell em-muted" style="padding:14px 8px;font-size:18px;color:#bbb;font-family:${FONT_STACK};text-align:center;border-top:1px solid #eee;">→</td>
    <td class="em-tbl-cell em-text" style="padding:14px 16px;font-size:14px;color:#333;font-family:${FONT_STACK};border-top:1px solid #eee;font-weight:500;">{{this.to}}</td>
    <td class="em-tbl-cell em-text" style="padding:14px 16px;font-size:14px;color:#111;font-weight:700;font-family:${MONO_STACK};text-align:right;border-top:1px solid #eee;">{{../currency}} {{this.formattedAmount}}</td>
  </tr>
  {{/each}}
</table>
`;

const balancesTable = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border:1px solid #eee;border-radius:12px;border-collapse:separate;overflow:hidden;">
  <tr class="em-tbl-hdr" style="background:#f8f8f8;">
    <td class="em-tbl-cell" style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#888;font-family:${FONT_STACK};">Member</td>
    <td class="em-tbl-cell" style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#888;font-family:${FONT_STACK};text-align:right;">Paid</td>
    <td class="em-tbl-cell" style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#888;font-family:${FONT_STACK};text-align:right;">Owed</td>
    <td class="em-tbl-cell" style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#888;font-family:${FONT_STACK};text-align:right;">Net</td>
  </tr>
  {{#each overallBalances}}
  <tr class="em-tbl-row" style="border-top:1px solid #eee;">
    <td class="em-tbl-cell em-text" style="padding:12px 16px;font-size:14px;color:#333;font-family:${FONT_STACK};border-top:1px solid #eee;font-weight:500;">{{this.memberName}}</td>
    <td class="em-tbl-cell em-text" style="padding:12px 16px;font-size:13px;color:#555;font-family:${MONO_STACK};text-align:right;border-top:1px solid #eee;">{{../currency}} {{this.formattedPaid}}</td>
    <td class="em-tbl-cell em-text" style="padding:12px 16px;font-size:13px;color:#555;font-family:${MONO_STACK};text-align:right;border-top:1px solid #eee;">{{../currency}} {{this.formattedOwed}}</td>
    <td class="em-tbl-cell" style="padding:12px 16px;font-size:14px;font-weight:700;font-family:${MONO_STACK};text-align:right;border-top:1px solid #eee;color:{{this.netColor}};">{{this.netPrefix}}{{../currency}} {{this.formattedNet}}</td>
  </tr>
  {{/each}}
</table>
`;

const body = `
${heading('New expense added')}
${subheading('A new expense was recorded in <strong>"{{workspaceName}}"</strong>')}

<!-- Hero amount -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
  <tr>
    <td class="em-info-row" align="center" style="background:#f8f8f8;border-radius:14px;padding:24px 20px;">
      <p class="em-muted" style="margin:0 0 6px;font-size:12px;color:#888;font-family:${FONT_STACK};text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">{{description}}</p>
      <p class="em-h" style="margin:0;font-size:32px;font-weight:700;color:#111;font-family:${MONO_STACK};letter-spacing:-0.5px;">{{currency}} {{formattedAmount}}</p>
      <p class="em-muted" style="margin:8px 0 0;font-size:13px;color:#888;font-family:${FONT_STACK};">Paid by <strong style="color:#555;">{{payerName}}</strong></p>
    </td>
  </tr>
</table>

${sectionHeading('Expense details')}
${infoTable(
  infoRow('Description', '<strong>{{description}}</strong>') +
  infoRow('Category', '{{category}}') +
  infoRow('Split mode', '{{splitMode}}') +
  infoRow('Date', '{{occurredAt}}') +
  infoRow('Added by', '{{createdByName}}')
)}

{{#if notes}}
${calloutBox('<strong style="color:#111;">Note:</strong> <span style="color:#555;">{{notes}}</span>')}
{{/if}}

${divider()}

${sectionHeading('Split breakdown')}
<p class="em-muted" style="margin:0 0 14px;font-size:13px;color:#777;font-family:${FONT_STACK};">Here's how the total is divided across each member:</p>
${splitsTable}

{{#if suggestedTransfers.length}}
${divider()}

${sectionHeading('Suggested transfers · this expense')}
<p class="em-muted" style="margin:0 0 14px;font-size:13px;color:#777;font-family:${FONT_STACK};line-height:1.55;">
  For this expense alone, here's who owes <strong style="color:#555;">{{payerName}}</strong>:
</p>
${transfersTable('suggestedTransfers', '#f8f8f8')}
{{/if}}

{{#if hasOverall}}
${divider()}

<!-- OVERALL section — visually elevated -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 18px;">
  <tr>
    <td style="background:#111;border-radius:14px 14px 0 0;padding:18px 22px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-family:${FONT_STACK};">Overall settlement</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;font-family:${FONT_STACK};letter-spacing:-0.3px;">Suggested transfers across the whole circle</p>
      <p style="margin:8px 0 0;font-size:13px;color:#d1d5db;font-family:${FONT_STACK};line-height:1.5;">
        These payments will settle <strong style="color:#fff;">every outstanding balance</strong> in
        "{{workspaceName}}" — combining all expenses and prior settlements.
      </p>
    </td>
  </tr>
  <tr>
    <td style="background:#fafafa;border:1px solid #eee;border-top:0;border-radius:0 0 14px 14px;padding:22px;">
      <p class="em-muted" style="margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#888;font-family:${FONT_STACK};">Recommended transfers</p>
      ${transfersTable('overallTransfers', '#ffffff')}

      <p class="em-muted" style="margin:18px 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#888;font-family:${FONT_STACK};">Net balances</p>
      ${balancesTable}

      <p class="em-muted" style="margin:6px 0 0;font-size:12px;color:#999;font-family:${FONT_STACK};line-height:1.5;">
        <strong style="color:#0a7f3f;">Green</strong> = others owe them ·
        <strong style="color:#c0392b;">Red</strong> = they owe others
      </p>
    </td>
  </tr>
</table>
{{/if}}

${button('View Expense', '{{expenseUrl}}')}

${divider()}

<p class="em-muted" style="margin:0;text-align:center;font-size:13px;color:#999;font-family:${FONT_STACK};line-height:1.5;">
  Added by <strong style="color:#666;">{{createdByName}}</strong> · {{occurredAt}}
</p>
`;

export const expenseCreatedTemplate = {
  subject: 'New expense in "{{workspaceName}}" — {{description}}',
  html: renderBaseLayout({
    preheader: '{{payerName}} paid {{currency}} {{formattedAmount}} for {{description}}.',
    body,
  }),
};
