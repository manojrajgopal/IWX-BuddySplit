import { z } from 'zod';

export const smtpConfigSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.coerce.boolean().default(false),
  user: z.string().optional().default(''),
  password: z.string().optional().default(''),
});

export const gmailOAuthConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url().optional().default(''),
  refreshToken: z.string().min(1),
  accessToken: z.string().optional().default(''),
});

export const emailAccountCreateSchema = z.object({
  name: z.string().min(1).max(120),
  provider: z.enum(['smtp', 'gmail_oauth']),
  fromAddress: z.string().min(3).max(255),
  isActive: z.boolean().optional().default(true),
  isDefault: z.boolean().optional().default(false),
  config: z.union([smtpConfigSchema, gmailOAuthConfigSchema]),
});

export const emailAccountUpdateSchema = emailAccountCreateSchema.partial();

export type EmailAccountCreateDto = z.infer<typeof emailAccountCreateSchema>;
export type EmailAccountUpdateDto = z.infer<typeof emailAccountUpdateSchema>;
export type SmtpConfig = z.infer<typeof smtpConfigSchema>;
export type GmailOAuthConfig = z.infer<typeof gmailOAuthConfigSchema>;
