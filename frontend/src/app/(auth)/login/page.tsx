'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, clearTokenCache } from '@/lib/api/client';

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await apiClient<{ accessToken: string; refreshToken: string }>('/v1/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      // Hand off tokens to a server route that sets HttpOnly cookies.
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(res),
      });
      clearTokenCache();
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h2 className="card__title">Welcome back</h2>
        <p className="card__subtitle">Sign in to your account</p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {error && <div className="field__error" role="alert">{error}</div>}
          <button className="btn btn--primary" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="divider" />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <a href="/forgot-password" className="text-secondary">Forgot password?</a>
          <a href="/register">Create account</a>
        </div>
      </div>
    </div>
  );
}
