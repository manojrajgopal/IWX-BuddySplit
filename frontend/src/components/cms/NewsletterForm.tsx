'use client';
import { useState, type FormEvent } from 'react';
import { apiClient } from '@/lib/api/client';

interface Props {
  source?: string;
  variant?: 'card' | 'inline';
}

export function NewsletterForm({ source = 'home', variant = 'card' }: Props): JSX.Element {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (status === 'loading') return;
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      await apiClient('/v1/newsletter/subscribe', {
        method: 'POST',
        body: { email: trimmed, source },
      });
      setStatus('ok');
      setMessage('You\'re subscribed! Check your inbox for a welcome email.');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage((err as Error).message || 'Could not subscribe. Please try again.');
    }
  }

  return (
    <form className={'newsletter-form newsletter-form--' + variant} onSubmit={onSubmit} noValidate>
      <div className="newsletter-form__row">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input newsletter-form__input"
          aria-label="Email address"
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          className="btn btn--primary newsletter-form__btn"
          disabled={status === 'loading' || !email}
        >
          {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>
      {message && (
        <p className={'newsletter-form__msg newsletter-form__msg--' + (status === 'ok' ? 'ok' : 'err')} role="status">
          {message}
        </p>
      )}
      <p className="newsletter-form__hint">
        Monthly tips · product updates · zero spam. Unsubscribe anytime.
      </p>
    </form>
  );
}
