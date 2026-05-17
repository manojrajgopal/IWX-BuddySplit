'use client';
import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { AuthField, AuthInput } from '@/components/auth/AuthField';
import { OtpGrid } from '@/components/auth/OtpGrid';
import { PasswordStrengthBlock } from '@/components/auth/PasswordStrengthBlock';
import { AuthTrust } from '@/components/auth/AuthTrust';
import {
  IconAlertCircle, IconArrowLeft, IconArrowRight, IconCheck, IconEye,
  IconEyeOff, IconKey, IconLock, IconMail, IconX,
} from '@/components/auth/Icons';
import { evaluatePassword, generatePassword } from '@/lib/password';

type StepKey = 'email' | 'code' | 'password' | 'done';

const STEPS: Array<{ key: StepKey; label: string; icon: JSX.Element }> = [
  { key: 'email',    label: 'Email',    icon: <IconMail size={14} /> },
  { key: 'code',     label: 'Verify',   icon: <IconKey size={14} /> },
  { key: 'password', label: 'New pass', icon: <IconLock size={14} /> },
];

export function ForgotPasswordForm(): JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState<StepKey>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const strength = useMemo(() => evaluatePassword(password, [email]), [password, email]);
  const confirmValid = confirmPassword.length > 0 && confirmPassword === password;
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  async function requestReset(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!emailValid) return;
    setError(null); setBusy(true);
    try {
      await apiClient('/v1/auth/forgot-password', { method: 'POST', body: { email: email.trim().toLowerCase() } });
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset code.');
    } finally { setBusy(false); }
  }

  function continueWithCode(e: FormEvent): void {
    e.preventDefault();
    if (code.length !== 6) return;
    setError(null);
    setStep('password');
  }

  async function resetPassword(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!strength.allOk || !confirmValid) return;
    setError(null); setBusy(true);
    try {
      await apiClient('/v1/auth/reset-password', {
        method: 'POST',
        body: { email: email.trim().toLowerCase(), code, newPassword: password },
      });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed. Your code may have expired.');
    } finally { setBusy(false); }
  }

  async function resendCode(): Promise<void> {
    setError(null); setBusy(true);
    try {
      await apiClient('/v1/auth/forgot-password', { method: 'POST', body: { email: email.trim().toLowerCase() } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.');
    } finally { setBusy(false); }
  }

  return (
    <form
      className="auth__form"
      onSubmit={
        step === 'email' ? requestReset
        : step === 'code' ? continueWithCode
        : step === 'password' ? resetPassword
        : (e) => { e.preventDefault(); router.push('/login'); }
      }
      noValidate
    >
      <div className="auth__form-head">
        <span className="auth__form-icon"><IconKey size={20} /></span>
        <h2>Reset your password</h2>
        <p className="auth__form-sub">
          Enter the email address linked to your account. We&apos;ll send a 6-digit verification code so you can choose a new password.
          Your workspaces, expenses and settlement history will remain exactly as you left them.
        </p>
      </div>

      {step !== 'done' && (
        <div className="auth-steps" aria-label="Reset progress">
          {STEPS.map((s, i) => {
            const status = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'pending';
            return (
              <div key={s.key} className={'auth-step auth-step--' + status} style={{ flex: i === STEPS.length - 1 ? '0 0 auto' : '1' }}>
                <span className="auth-step__circle">{status === 'done' ? <IconCheck size={14} /> : s.icon}</span>
                <span className="auth-step__label">{s.label}</span>
                {i < STEPS.length - 1 && <span className="auth-step__bar" />}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="auth-alert auth-alert--error" role="alert">
          <IconAlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {step === 'email' && (
        <>
          <AuthField label="Email address" htmlFor="fp-email" hint="If an account exists with this email, you'll receive a code within a minute.">
            <AuthInput
              id="fp-email" type="email" inputMode="email" autoComplete="email" required autoFocus
              placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              icon={<IconMail size={16} />}
              validity={email.length === 0 ? null : emailValid ? 'valid' : 'invalid'}
            />
          </AuthField>

          <button className="auth-btn auth-btn--primary" type="submit" disabled={busy || !emailValid}>
            {busy ? 'Sending code…' : <>Send reset code <IconArrowRight size={16} /></>}
          </button>

          <div className="auth-divider"><span>Remembered it?</span></div>

          <Link href="/login" className="auth-btn auth-btn--outline" style={{ textDecoration: 'none' }}>
            <IconArrowLeft size={16} /> Back to sign in
          </Link>

          <AuthTrust />
        </>
      )}

      {step === 'code' && (
        <>
          <AuthField label="Verification code" hint={<>We sent a 6-digit code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. It expires in 10 minutes.</>}>
            <OtpGrid value={code} onChange={setCode} autoFocus />
          </AuthField>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
            <span className="text-muted">Didn&apos;t get it? Check spam, or</span>
            <button type="button" className="auth-field__link" onClick={resendCode} disabled={busy}>
              {busy ? 'Resending…' : 'Resend code'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '0.6rem' }}>
            <button type="button" className="auth-btn auth-btn--outline" onClick={() => setStep('email')}>
              <IconArrowLeft size={16} /> Back
            </button>
            <button className="auth-btn auth-btn--primary" type="submit" disabled={code.length !== 6}>
              Continue <IconArrowRight size={16} />
            </button>
          </div>
        </>
      )}

      {step === 'password' && (
        <>
          <AuthField label="New password" htmlFor="fp-password" hint="Pick something different from your last one. We hash with Argon2id — never stored as plain text.">
            <AuthInput
              id="fp-password" type={showPwd ? 'text' : 'password'} autoComplete="new-password" required spellCheck={false}
              placeholder="Choose a strong password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              icon={<IconLock size={16} />}
              validity={password.length === 0 ? null : strength.allOk ? 'valid' : password.length < 4 ? null : 'invalid'}
              trail={
                <button type="button" tabIndex={-1} className="auth-icon-btn"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              }
            />
          </AuthField>

          <PasswordStrengthBlock
            value={password}
            strength={strength}
            onGenerate={() => setGenerated(generatePassword(16))}
            onUseGenerated={(g) => { setPassword(g); setConfirmPassword(g); setShowPwd(true); setShowConfirm(true); }}
            generated={generated}
          />

          <AuthField label="Confirm new password" htmlFor="fp-confirm">
            <AuthInput
              id="fp-confirm" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" required spellCheck={false}
              placeholder="Re-enter your new password"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<IconLock size={16} />}
              validity={confirmPassword.length === 0 ? null : confirmValid ? 'valid' : 'invalid'}
              trail={
                <button type="button" tabIndex={-1} className="auth-icon-btn"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              }
            />
            {confirmPassword.length > 0 && (
              <div className={'pwd-match ' + (confirmValid ? 'pwd-match--ok' : 'pwd-match--bad')}>
                {confirmValid ? <IconCheck size={12} /> : <IconX size={12} />}
                {confirmValid ? 'Passwords match' : 'Passwords don\u2019t match yet'}
              </div>
            )}
          </AuthField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '0.6rem' }}>
            <button type="button" className="auth-btn auth-btn--outline" onClick={() => setStep('code')}>
              <IconArrowLeft size={16} /> Back
            </button>
            <button className="auth-btn auth-btn--primary" type="submit" disabled={busy || !strength.allOk || !confirmValid}>
              {busy ? 'Updating…' : <>Reset password <IconArrowRight size={16} /></>}
            </button>
          </div>
        </>
      )}

      {step === 'done' && (
        <>
          <div className="auth-alert auth-alert--success" role="status">
            <IconCheck size={16} />
            <span>
              <strong>Password updated.</strong> Your new password is now active.
              All other devices have been signed out for security.
            </span>
          </div>
          <Link href="/login" className="auth-btn auth-btn--primary" style={{ textDecoration: 'none' }}>
            Continue to sign in <IconArrowRight size={16} />
          </Link>
          <AuthTrust />
        </>
      )}

      <p className="auth-fineprint">
        For your security, password reset codes expire after 10 minutes and can be used only once.
        If you didn&apos;t request this, you can safely ignore the email — nothing will change.
      </p>
    </form>
  );
}
