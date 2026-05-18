/**
 * Built-in email template registry.
 *
 * These file-based templates are the canonical source. They are used as fallback
 * by MailService when no override exists in the database (email_templates table).
 * Admins can still override any template via the database/admin UI.
 */

import { otpTemplates } from './otp.template';
import { inviteTemplate } from './invite.template';
import { expenseCreatedTemplate } from './expense-created.template';
import { memberJoinedTemplate } from './member-joined.template';

export interface BuiltInTemplate {
  subject: string;
  html: string;
}

export const builtInTemplates: Record<string, BuiltInTemplate> = {
  'auth.otp.register':       otpTemplates.register,
  'auth.otp.login':          otpTemplates.login,
  'auth.otp.reset_password': otpTemplates.reset_password,
  'auth.otp.email_change':   otpTemplates.email_change,
  'invite.sent':             inviteTemplate,
  'expense.created':         expenseCreatedTemplate,
  'member.joined':           memberJoinedTemplate,
};

export function getBuiltInTemplate(key: string): BuiltInTemplate | null {
  return builtInTemplates[key] ?? null;
}
