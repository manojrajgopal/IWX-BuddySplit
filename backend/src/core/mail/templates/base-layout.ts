/**
 * Base email layout — the master wrapper for ALL emails.
 *
 * Provides logo header, company footer, dark mode support, and responsive design.
 * Body content is injected by individual template files.
 *
 * Variables (auto-injected by MailService):
 *   {{logoUrl}}      — Company logo URL
 *   {{appName}}      — App display name (e.g. "IWX BuddySplit")
 *   {{companyName}}  — Parent company (e.g. "InfiniteWaveX")
 *   {{webUrl}}       — Public web URL
 *   {{year}}         — Current year
 */

export const FONT_STACK =
  "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
export const MONO_STACK =
  "'JetBrains Mono','SFMono-Regular',Menlo,Consolas,monospace";

export interface LayoutOptions {
  /** Preview text shown in inbox list (Gmail, Outlook). */
  preheader?: string;
  /** Main body HTML content (already styled). */
  body: string;
}

export function renderBaseLayout(opts: LayoutOptions): string {
  const preheader = opts.preheader ?? '';
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>{{appName}}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body,table,td,p,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}
    img{border:0;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;display:block}
    body{margin:0;padding:0;width:100%!important;height:100%!important}
    a{color:#111;text-decoration:underline}

    /* Dark mode */
    @media (prefers-color-scheme: dark){
      .em-body{background:#0a0a0a!important}
      .em-card{background:#141414!important;border-color:#222!important}
      .em-text{color:#e8e8e8!important}
      .em-muted{color:#9a9a9a!important}
      .em-h{color:#ffffff!important}
      .em-footer{color:#666!important}
      .em-hr{border-color:#222!important}
      .em-otp{background:#1a1a1a!important;color:#fff!important}
      .em-tbl-hdr{background:#1a1a1a!important}
      .em-tbl-row td{border-color:#222!important;color:#e8e8e8!important}
      .em-tbl-row-alt{background:#0f0f0f!important}
      .em-info-row{background:#161616!important}
      .em-btn{background:#fff!important}
      .em-btn a{color:#111!important}
      .em-avatar{background:#1a1a1a!important;color:#fff!important}
      .em-badge{background:#fff!important;color:#111!important}
    }

    /* Mobile responsive */
    @media only screen and (max-width:620px){
      .em-container{width:100%!important;padding:12px!important}
      .em-card{padding:28px 22px!important;border-radius:14px!important}
      .em-h{font-size:22px!important}
      .em-h2{font-size:15px!important}
      .em-otp{font-size:30px!important;letter-spacing:6px!important;padding:14px 24px!important}
      .em-avatar{width:56px!important;height:56px!important;line-height:56px!important;font-size:24px!important}
      .em-cell-label{width:auto!important;display:block!important;padding-bottom:2px!important}
      .em-cell-value{display:block!important;padding-top:0!important}
      .em-info-row{display:block!important}
      .em-tbl-cell{padding:10px 12px!important;font-size:13px!important}
    }
  </style>
</head>
<body class="em-text" style="margin:0;padding:0;background:#f5f5f5;font-family:${FONT_STACK};color:#111;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;font-size:1px;color:#f5f5f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${escapeForPreheader(preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="em-body" style="background:#f5f5f5;">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table role="presentation" class="em-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header with Brand Mark (CSS-only — email clients block SVG/external images) -->
          <tr>
            <td align="center" style="padding:0 0 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:#111;border-radius:12px;width:48px;height:48px;">
                      <tr>
                        <td align="center" valign="middle" height="48" style="width:48px;height:48px;font-family:${FONT_STACK};font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;text-align:center;line-height:48px;">IWX</td>
                      </tr>
                    </table>
                  </td>
                  <td style="padding:0 0 0 12px;vertical-align:middle;">
                    <div style="font-family:${FONT_STACK};font-size:18px;font-weight:700;color:#111;letter-spacing:-0.3px;line-height:1.2;">{{appName}}</div>
                    <div style="font-family:${FONT_STACK};font-size:12px;font-weight:500;color:#888;letter-spacing:0.3px;line-height:1.2;margin-top:2px;">by {{companyName}}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" class="em-card" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;border:1px solid #e8e8e8;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
                <tr>
                  <td style="padding:40px 36px;">
                    ${opts.body}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 16px 0;">
              <p class="em-footer" style="margin:0 0 8px;font-size:13px;color:#888;font-family:${FONT_STACK};line-height:1.5;">
                Sent by <strong style="color:#555;">{{appName}}</strong> · Split expenses fairly with friends
              </p>
              <p class="em-footer" style="margin:0 0 8px;font-size:12px;color:#aaa;font-family:${FONT_STACK};line-height:1.5;">
                © {{year}} {{companyName}}. All rights reserved.
              </p>
              <p class="em-footer" style="margin:0;font-size:11px;color:#bbb;font-family:${FONT_STACK};line-height:1.5;">
                This is an automated message. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ── Reusable styled building blocks for body content ─────────────────────── */

export function heading(text: string): string {
  return `<h1 class="em-h" style="margin:0 0 8px;font-size:26px;font-weight:700;color:#111;font-family:${FONT_STACK};line-height:1.25;letter-spacing:-0.4px;">${text}</h1>`;
}

export function subheading(text: string): string {
  return `<p class="em-muted" style="margin:0 0 28px;font-size:14px;color:#777;font-family:${FONT_STACK};line-height:1.5;">${text}</p>`;
}

export function sectionHeading(text: string): string {
  return `<h2 class="em-h2" style="margin:0 0 14px;font-size:16px;font-weight:700;color:#111;font-family:${FONT_STACK};letter-spacing:-0.2px;">${text}</h2>`;
}

export function paragraph(text: string): string {
  return `<p class="em-text" style="margin:0 0 16px;font-size:15px;color:#333;font-family:${FONT_STACK};line-height:1.65;">${text}</p>`;
}

export function muted(text: string): string {
  return `<p class="em-muted" style="margin:0;font-size:13px;color:#888;font-family:${FONT_STACK};line-height:1.5;">${text}</p>`;
}

export function divider(): string {
  return `<hr class="em-hr" style="border:none;border-top:1px solid #eee;margin:28px 0;" />`;
}

export function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto;">
  <tr>
    <td class="em-btn" align="center" style="border-radius:10px;background:#111;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;font-family:${FONT_STACK};">${label}</a>
    </td>
  </tr>
</table>`;
}

export function infoRow(label: string, value: string): string {
  return `<tr class="em-info-row">
    <td class="em-cell-label em-muted" style="padding:10px 0;font-size:13px;color:#888;font-family:${FONT_STACK};vertical-align:top;width:140px;">${label}</td>
    <td class="em-cell-value em-text" style="padding:10px 0;font-size:14px;color:#333;font-weight:500;font-family:${FONT_STACK};vertical-align:top;">${value}</td>
  </tr>`;
}

export function infoTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
${rows}
</table>`;
}

export function calloutBox(content: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr>
      <td class="em-info-row" style="background:#f8f8f8;border-radius:10px;padding:16px 20px;font-size:14px;color:#333;font-family:${FONT_STACK};line-height:1.5;">${content}</td>
    </tr>
  </table>`;
}

function escapeForPreheader(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}
