'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

type Step = 'details' | 'verify';

export default function RegisterPage(): JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState<Step>('details');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestOtp(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await apiClient('/v1/auth/register/request', { method: 'POST', body: { email } });
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally { setBusy(false); }
  }

  async function verifyOtp(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const res = await apiClient<{ accessToken: string; refreshToken: string }>(
        '/v1/auth/register/verify',
        { method: 'POST', body: { email, code, displayName, password, confirmPassword, phone: phone || undefined } },
      );
      await fetch('/api/auth/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(res) });
      router.push('/dashboard'); router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally { setBusy(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        {step === 'details' ? (
          <>
            <h2 className="card__title">Create your account</h2>
            <p className="card__subtitle">We&apos;ll send a verification code to your email</p>
            <form onSubmit={requestOtp}>
              <div className="field">
                <label className="label">Display name</label>
                <input className="input" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Email</label>
                <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Phone number</label>
                <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
              </div>
              <div className="field">
                <label className="label">Password</label>
                <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Confirm password</label>
                <input className="input" type="password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              {error && <div className="field__error">{error}</div>}
              <button className="btn btn--primary" type="submit" disabled={busy} style={{ width: '100%' }}>
                {busy ? 'Sending code…' : 'Continue'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="card__title">Verify your email</h2>
            <p className="card__subtitle">Enter the 6-digit code sent to {email}</p>
            <form onSubmit={verifyOtp}>
              <div className="field">
                <label className="label">Verification code</label>
                <input className="input text-mono" inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.25rem' }} />
              </div>
              {error && <div className="field__error">{error}</div>}
              <button className="btn btn--primary" type="submit" disabled={busy || code.length !== 6} style={{ width: '100%' }}>
                {busy ? 'Verifying…' : 'Verify & sign in'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
