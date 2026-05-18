/**
 * OTP / verification code email templates.
 *
 * Variables (per send):
 *   {{code}}        — The verification code
 *   {{ttlMinutes}}  — Minutes until expiry
 *   {{email}}       — Recipient email (optional, for context)
 */

import {
  renderBaseLayout, heading, subheading, divider, muted,
  FONT_STACK, MONO_STACK,
} from './base-layout';

interface OtpVariant {
  title: string;
  intro: string;
  disclaimer: string;
}

const VARIANTS: Record<string, OtpVariant> = {
  register: {
    title: 'Verify your email',
    intro: 'Use the code below to complete your registration and activate your account.',
    disclaimer: 'If you did not create an account with {{appName}}, you can safely ignore this email — no account will be created.',
  },
  login: {
    title: 'Confirm your sign-in',
    intro: 'Use the code below to verify your identity and sign in to your account.',
    disclaimer: 'If this wasn\'t you, please change your password immediately and contact our support team.',
  },
  reset_password: {
    title: 'Reset your password',
    intro: 'Use the code below to set a new password for your account.',
    disclaimer: 'If you did not request a password reset, please ignore this email — your account remains secure.',
  },
  email_change: {
    title: 'Confirm your new email',
    intro: 'Use the code below to verify and switch to this new email address.',
    disclaimer: 'If you did not request to change your email address, please contact our support team immediately.',
  },
};

function buildOtpHtml(variant: OtpVariant): string {
  const body = `
${heading(variant.title)}
${subheading(variant.intro)}

<!-- OTP code block -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 16px;">
  <tr>
    <td align="center">
      <div class="em-otp" style="display:inline-block;padding:20px 40px;background:#f3f3f3;border:1px solid #e8e8e8;border-radius:14px;font-size:38px;font-weight:700;letter-spacing:10px;color:#111;font-family:${MONO_STACK};line-height:1;">{{code}}</div>
    </td>
  </tr>
</table>

<p class="em-text" style="margin:0 0 8px;text-align:center;font-size:14px;color:#555;font-family:${FONT_STACK};line-height:1.5;">
  This code expires in <strong>{{ttlMinutes}} minutes</strong>.
</p>
<p class="em-muted" style="margin:0 0 24px;text-align:center;font-size:13px;color:#999;font-family:${FONT_STACK};line-height:1.5;">
  For your security, never share this code with anyone.
</p>

${divider()}

${muted(variant.disclaimer)}
`;
  return renderBaseLayout({
    preheader: `Your {{appName}} code: enter it within {{ttlMinutes}} minutes.`,
    body,
  });
}

export const otpTemplates = {
  register: {
    subject: 'Verify your email — {{appName}}',
    html: buildOtpHtml(VARIANTS.register),
  },
  login: {
    subject: 'Confirm your sign-in — {{appName}}',
    html: buildOtpHtml(VARIANTS.login),
  },
  reset_password: {
    subject: 'Reset your password — {{appName}}',
    html: buildOtpHtml(VARIANTS.reset_password),
  },
  email_change: {
    subject: 'Confirm your new email — {{appName}}',
    html: buildOtpHtml(VARIANTS.email_change),
  },
};
