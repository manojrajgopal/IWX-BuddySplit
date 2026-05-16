'use client';
import { useState, FormEvent } from 'react';
import { apiClient } from '@/lib/api/client';

type Step = 'email' | 'reset';

export default function ForgotPasswordPage(): JSX.Element {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestReset(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      await apiClient('/v1/auth/forgot-password', { method: 'POST', body: { email } });
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally { setBusy(false); }
  }

  async function resetPassword(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      await apiClient('/v1/auth/reset-password', { method: 'POST', body: { email, code, newPassword: password } });
      setMessage('Password reset. You can now sign in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally { setBusy(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        {step === 'email' ? (
          <>
            <h2 className="card__title">Forgot password?</h2>
            <p className="card__subtitle">We'll send a reset code to your email</p>
            <form onSubmit={requestReset}>
              <div className="field"><label className="label">Email</label>
                <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {error && <div className="field__error">{error}</div>}
              <button className="btn btn--primary" type="submit" disabled={busy} style={{ width: '100%' }}>
                {busy ? 'Sending…' : 'Send code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="card__title">Reset password</h2>
            <p className="card__subtitle">Enter the code and choose a new password</p>
            {message ? (
              <p className="text-positive">{message}</p>
            ) : (
              <form onSubmit={resetPassword}>
                <div className="field"><label className="label">Code</label>
                  <input className="input text-mono" required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} maxLength={6} />
                </div>
                <div className="field"><label className="label">New password</label>
                  <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {error && <div className="field__error">{error}</div>}
                <button className="btn btn--primary" type="submit" disabled={busy} style={{ width: '100%' }}>
                  {busy ? 'Updating…' : 'Reset password'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
