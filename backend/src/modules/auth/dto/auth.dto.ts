import { z } from 'zod';

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
});
export type RegisterRequestDto = z.infer<typeof RegisterRequestSchema>;

export const RegisterVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{4,8}$/),
  displayName: z.string().min(1).max(80),
  password: z.string().min(8).max(128),
});
export type RegisterVerifyDto = z.infer<typeof RegisterVerifySchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const RefreshSchema = z.object({ refreshToken: z.string().min(10) });
export type RefreshDto = z.infer<typeof RefreshSchema>;

export const ForgotPasswordSchema = z.object({ email: z.string().email() });
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{4,8}$/),
  newPassword: z.string().min(8).max(128),
});
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
