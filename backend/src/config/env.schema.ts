import { z } from 'zod';

const Bool = z.preprocess(
  (v) => (typeof v === 'string' ? v.toLowerCase() === 'true' : v),
  z.boolean(),
);

const Int = (def?: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.length > 0 ? Number(v) : v),
    def === undefined ? z.number().int() : z.number().int().default(def),
  );

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().default('IWX-BuddySplit'),
  PORT: Int(4000),
  PUBLIC_API_URL: z.string().url(),
  PUBLIC_WEB_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DB_HOST: z.string(),
  DB_PORT: Int(5432),
  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string(),
  DB_DATABASE: z.string(),
  DB_SSL: Bool.default(false),
  DB_POOL_MAX: Int(20),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_TTL: z.string().default('30d'),
  OTP_HMAC_SECRET: z.string().min(32),
  OTP_TTL_SECONDS: Int(600),
  OTP_LENGTH: Int(6),
  PASSWORD_PEPPER: z.string().min(8),

  SMTP_HOST: z.string(),
  SMTP_PORT: Int(1025),
  SMTP_SECURE: Bool.default(false),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),
  MAIL_FROM: z.string(),

  CORS_ORIGINS: z.string().default(''),
  SOCKET_PATH: z.string().default('/realtime'),

  LRU_MAX_ITEMS: Int(5000),
  LRU_TTL_MS: Int(60000),

  REVALIDATION_SECRET: z.string().min(16),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(): AppConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // Friendly first-class failure: no app should boot with bad config.
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
