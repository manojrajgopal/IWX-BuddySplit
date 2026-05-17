'use client';
import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient, clearTokenCache } from '@/lib/api/client';
import { AuthField, AuthInput } from '@/components/auth/AuthField';
import { OtpGrid } from '@/components/auth/OtpGrid';
import { PasswordStrengthBlock } from '@/components/auth/PasswordStrengthBlock';
import {
  IconAlertCircle, IconArrowLeft, IconArrowRight, IconCheck, IconEye,
  IconEyeOff, IconLock, IconMail, IconSparkle, IconUser, IconUserPlus, IconX,
} from '@/components/auth/Icons';
import { evaluatePassword, generatePassword } from '@/lib/password';

type StepKey = 'identity' | 'security' | 'verify' | 'success';

const STEP_DEFS: Array<{ key: StepKey; label: string; icon: JSX.Element }> = [
  { key: 'identity', label: 'Identity', icon: <IconUser size={14} /> },
  { key: 'security', label: 'Security', icon: <IconLock size={14} /> },
  { key: 'verify',   label: 'Verify',   icon: <IconCheck size={14} /> },
];

export function RegisterForm(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams?.get('next') || '/dashboard';
  const [step, setStep] = useState<StepKey>('identity');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const nameValid  = displayName.trim().length >= 2;
  const strength = useMemo(() => evaluatePassword(password, [email, displayName]), [password, email, displayName]);
  const confirmValid = confirmPassword.length > 0 && confirmPassword === password;
  const identityValid = nameValid && emailValid;
  const securityValid = strength.allOk && confirmValid && acceptTerms;

  async function submitIdentity(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!identityValid) return;
    setError(null);
    setStep('security');
  }

  async function submitSecurity(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!securityValid) return;
    setError(null); setBusy(true);
    try {
      await apiClient('/v1/auth/register/request', {
        method: 'POST',
        body: { email: email.trim().toLowerCase() },
      });
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send verification code. Please try again.');
    } finally { setBusy(false); }
  }

  async function submitVerify(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (code.length !== 6) return;
    setError(null); setBusy(true);
    try {
      const res = await apiClient<{ accessToken: string; refreshToken: string }>(
        '/v1/auth/register/verify',
        {
          method: 'POST',
          body: {
            email: email.trim().toLowerCase(),
            code,
            displayName: displayName.trim(),
            password,
            confirmPassword,
            phone: phone.trim() || undefined,
          },
        },
      );
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(res),
      });
      clearTokenCache();
      setStep('success');
      setTimeout(() => {
        router.push(nextUrl);
        router.refresh();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please check your code and try again.');
    } finally { setBusy(false); }
  }

  async function resendCode(): Promise<void> {
    setError(null); setBusy(true);
    try {
      await apiClient('/v1/auth/register/request', { method: 'POST', body: { email: email.trim().toLowerCase() } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.');
    } finally { setBusy(false); }
  }

  const stepIndex = STEP_DEFS.findIndex((s) => s.key === step);

  return (
    <form
      className="auth__form"
      onSubmit={step === 'identity' ? submitIdentity : step === 'security' ? submitSecurity : submitVerify}
      noValidate
    >
      {step !== 'success' && (
        <div className="auth__form-head">
          <span className="auth__form-icon"><IconUserPlus size={20} /></span>
          <h2>Create your account</h2>
          <p className="auth__form-sub">
            Join a community that values privacy, exact math, and real connections. Set up takes under a minute — no credit card required.
          </p>
        </div>
      )}

      {/* Step indicator */}
      {step !== 'success' && <div className="auth-steps" aria-label="Sign-up progress">
        {STEP_DEFS.map((s, i) => {
          const status = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'pending';
          return (
            <div key={s.key} className={'auth-step auth-step--' + status} style={{ flex: i === STEP_DEFS.length - 1 ? '0 0 auto' : '1' }}>
              <span className="auth-step__circle">{status === 'done' ? <IconCheck size={14} /> : s.icon}</span>
              <span className="auth-step__label">{s.label}</span>
              {i < STEP_DEFS.length - 1 && <span className="auth-step__bar" />}
            </div>
          );
        })}
      </div>}

      {error && (
        <div className="auth-alert auth-alert--error" role="alert">
          <IconAlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {step === 'identity' && (
        <>
          <AuthField label="Display name" htmlFor="reg-name" hint="Shown on your workspace dashboards and split lists. You can change this later.">
            <AuthInput
              id="reg-name" type="text" autoComplete="name" required autoFocus
              placeholder="e.g. Alex Carter"
              value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              icon={<IconSparkle size={16} />}
              validity={displayName.length === 0 ? null : nameValid ? 'valid' : 'invalid'}
            />
          </AuthField>

          <AuthField label="Email address" htmlFor="reg-email" hint="We'll send you a 6-digit verification code in the next step.">
            <AuthInput
              id="reg-email" type="email" inputMode="email" autoComplete="email" required
              placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              icon={<IconMail size={16} />}
              validity={email.length === 0 ? null : emailValid ? 'valid' : 'invalid'}
              trail={emailValid ? <span className="auth-field__valid-indicator"><IconCheck size={16} /></span> : email.length > 0 ? <span className="auth-field__invalid-indicator"><IconX size={16} /></span> : null}
            />
          </AuthField>

          <AuthField label="Phone (optional)" htmlFor="reg-phone" hint="Used only for account recovery if you lose access to your email.">
            <AuthInput
              id="reg-phone" type="tel" autoComplete="tel"
              placeholder="+1 555 123 4567"
              value={phone} onChange={(e) => setPhone(e.target.value)}
              icon={<IconUser size={16} />}
            />
          </AuthField>

          <button className="auth-btn auth-btn--primary" type="submit" disabled={!identityValid}>
            Continue to security <IconArrowRight size={16} />
          </button>

          <div className="auth-divider"><span>Already a member?</span></div>

          <Link href="/login" className="auth-btn auth-btn--outline" style={{ textDecoration: 'none' }}>
            <IconArrowLeft size={16} /> Sign in instead
          </Link>
        </>
      )}

      {step === 'security' && (
        <>
          <AuthField label="Password" htmlFor="reg-password" hint="Mix uppercase, lowercase, numbers and symbols. We hash with Argon2id — never stored as plain text.">
            <AuthInput
              id="reg-password" type={showPwd ? 'text' : 'password'} autoComplete="new-password"
              required spellCheck={false}
              placeholder="Create a strong password"
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

          <AuthField label="Confirm password" htmlFor="reg-confirm">
            <AuthInput
              id="reg-confirm" type={showConfirm ? 'text' : 'password'} autoComplete="new-password"
              required spellCheck={false}
              placeholder="Re-enter your password"
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

          <label className="auth-check">
            <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
            <span className="auth-check__box"><IconCheck size={12} /></span>
            <span className="auth-check__label">
              I agree to the <Link href="/terms">Terms of Service</Link> and{' '}
              <Link href="/privacy">Privacy Policy</Link>.
            </span>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '0.6rem' }}>
            <button type="button" className="auth-btn auth-btn--outline" onClick={() => setStep('identity')}>
              <IconArrowLeft size={16} /> Back
            </button>
            <button className="auth-btn auth-btn--primary" type="submit" disabled={busy || !securityValid}>
              {busy ? 'Sending code…' : <>Send verification code <IconArrowRight size={16} /></>}
            </button>
          </div>
        </>
      )}

      {step === 'success' && (
        <div className="auth-success">
          <span className="auth-success__icon"><IconCheck size={32} /></span>
          <h3 className="auth-success__title">Account created!</h3>
          <p className="auth-success__text">
            Welcome aboard, <strong>{displayName}</strong>. Redirecting you now…
          </p>
          <button
            type="button"
            className="auth-btn auth-btn--primary"
            onClick={() => { router.push(nextUrl); router.refresh(); }}
          >
            Continue now <IconArrowRight size={16} />
          </button>
        </div>
      )}

      {step === 'verify' && (
        <>
          <AuthField label="Verification code" hint={<>We sent a 6-digit code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. It expires in 10 minutes.</>}>
            <OtpGrid value={code} onChange={setCode} autoFocus />
          </AuthField>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
            <span className="text-muted">Didn&apos;t receive the email? Check spam, or</span>
            <button type="button" className="auth-field__link" onClick={resendCode} disabled={busy}>
              {busy ? 'Resending…' : 'Resend code'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '0.6rem' }}>
            <button type="button" className="auth-btn auth-btn--outline" onClick={() => setStep('security')}>
              <IconArrowLeft size={16} /> Back
            </button>
            <button className="auth-btn auth-btn--primary" type="submit" disabled={busy || code.length !== 6}>
              {busy ? 'Verifying…' : <>Verify &amp; create account <IconArrowRight size={16} /></>}
            </button>
          </div>
        </>
      )}

      {step !== 'success' && (
        <p className="auth-fineprint">
          We use industry-standard Argon2id hashing, HMAC-SHA256 one-time codes, and rotating refresh tokens.
          Your data lives in your own database — there are no third-party analytics or advertising trackers on this site.
        </p>
      )}
    </form>
  );
}
