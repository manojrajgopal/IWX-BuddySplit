/**
 * Newsletter welcome email — sent when a visitor subscribes to the newsletter
 * from the Home page.
 *
 * Variables:
 *   {{email}}           — Subscriber email
 *   {{webUrl}}          — Public site URL
 */

import {
  renderBaseLayout, heading, subheading, divider, button,
  calloutBox, FONT_STACK,
} from './base-layout';

const body = `
${heading('Welcome to the {{appName}} newsletter!')}
${subheading('You\'re officially on the list. Thanks for joining us.')}

<p class="em-text" style="margin:0 0 16px;font-size:15px;color:#333;font-family:${FONT_STACK};line-height:1.65;">
  Hi there,
</p>

<p class="em-text" style="margin:0 0 16px;font-size:15px;color:#333;font-family:${FONT_STACK};line-height:1.65;">
  Thanks for subscribing to the {{appName}} newsletter using <strong>{{email}}</strong>. You'll now get the inside scoop on:
</p>

<ul style="margin:0 0 20px;padding-left:22px;color:#333;font-size:15px;font-family:${FONT_STACK};line-height:1.7;">
  <li><strong>Product updates</strong> — new split modes, smarter settlements, mobile improvements</li>
  <li><strong>Money-saving tips</strong> — how groups, roommates and travellers save more by tracking together</li>
  <li><strong>Real stories</strong> — how families, friend groups and offices use {{appName}} every day</li>
  <li><strong>Early access</strong> — try new features before everyone else</li>
</ul>

${calloutBox(`
  <strong style="display:block;margin-bottom:6px;color:#111;">Haven't created your account yet?</strong>
  <span style="color:#555;">Sign up in less than a minute and create your first Circle — completely free, no credit card required.</span>
`)}

${button('Create your free account', '{{webUrl}}/register')}

${divider()}

<p class="em-muted" style="margin:0;font-size:13px;color:#999;font-family:${FONT_STACK};line-height:1.5;">
  You're receiving this email because you subscribed at {{webUrl}}. If this wasn't you, simply ignore this message — we won't email you again.
</p>
`;

export const newsletterWelcomeTemplate = {
  subject: 'Welcome aboard — you\'re subscribed to {{appName}} 🎉',
  html: renderBaseLayout({
    preheader: 'Thanks for subscribing to the {{appName}} newsletter.',
    body,
  }),
};
