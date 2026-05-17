'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { clearTokenCache } from '@/lib/api/client';
import { AuthField, AuthInput } from '@/components/auth/AuthField';
import { AuthTrust } from '@/components/auth/AuthTrust';
import {
  IconAlertCircle, IconArrowRight, IconCheck, IconEye, IconEyeOff,
  IconLock, IconMail, IconUserPlus,
} from '@/components/auth/Icons';

export function LoginForm(): JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const next = params?.get('next') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = email.trim().length > 3 && password.length > 0;

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const res = await apiClient<{ accessToken: string; refreshToken: string }>('/v1/auth/login', {
        method: 'POST',
        body: { email: email.trim().toLowerCase(), password, remember },
      });
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(res),
      });
      clearTokenCache();
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
    } finally { setBusy(false); }
  }

  return (
    <form className="auth__form" onSubmit={onSubmit} noValidate>
      <div className="auth__form-head">
        <span className="auth__form-icon"><IconLock size={20} /></span>
        <h2>Welcome back</h2>
        <p className="auth__form-sub">
          Sign in to your workspace dashboard to review balances, settle pending transfers and pick up exactly where you left off.
        </p>
      </div>

      {error && (
        <div className="auth-alert auth-alert--error" role="alert">
          <IconAlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <AuthField label="Email address" htmlFor="login-email">
        <AuthInput
          id="login-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<IconMail size={16} />}
        />
      </AuthField>

      <AuthField
        label="Password"
        htmlFor="login-password"
        trailingLink={<Link href="/forgot-password" className="auth-field__link">Forgot password?</Link>}
      >
        <AuthInput
          id="login-password"
          type={showPwd ? 'text' : 'password'}
          autoComplete="current-password"
          required
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<IconLock size={16} />}
          trail={
            <button type="button" tabIndex={-1} className="auth-icon-btn"
              aria-label={showPwd ? 'Hide password' : 'Show password'}
              onClick={() => setShowPwd(!showPwd)}>
              {showPwd ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </button>
          }
        />
      </AuthField>

      <label className="auth-check">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        <span className="auth-check__box"><IconCheck size={12} /></span>
        <span className="auth-check__label">Keep me signed in for 30 days on this device</span>
      </label>

      <button className="auth-btn auth-btn--primary" type="submit" disabled={busy || !canSubmit}>
        {busy ? 'Signing in…' : <>Sign in <IconArrowRight size={16} /></>}
      </button>

      <div className="auth-divider"><span>New to BuddySplit?</span></div>

      <Link href="/register" className="auth-btn auth-btn--outline" style={{ textDecoration: 'none' }}>
        <IconUserPlus size={16} /> Create a new account
      </Link>

      <AuthTrust />

      <p className="auth-fineprint">
        By continuing you agree to our <Link href="/terms">Terms of Service</Link> and{' '}
        <Link href="/privacy">Privacy Policy</Link>. We never share your data with third parties or advertisers.
      </p>
    </form>
  );
}
