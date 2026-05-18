'use client';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient, clearTokenCache } from '@/lib/api/client';

/**
 * Renders the official Google Identity Services button.
 * Click the button → Google account chooser pops up → on selection the user
 * is signed in (or registered) and redirected — no typing required.
 *
 * Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID and backend GOOGLE_OAUTH_CLIENT_ID
 * to be set to the same Google OAuth Web Client ID.
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: {
            client_id: string;
            callback: (resp: { credential: string }) => void;
            auto_select?: boolean;
            ux_mode?: 'popup' | 'redirect';
            context?: 'signin' | 'signup' | 'use';
            itp_support?: boolean;
          }) => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';

interface Props {
  /** "signin_with" (default) | "signup_with" | "continue_with" */
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  /** "signin" or "signup" — affects Google's "no account" / "create account" copy */
  context?: 'signin' | 'signup';
  /** "outline" (default) | "filled_blue" | "filled_black" */
  theme?: 'outline' | 'filled_blue' | 'filled_black';
}

export function GoogleSignInButton({
  text = 'signin_with',
  context = 'signin',
  theme = 'outline',
}: Props): JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const next = params?.get('next') || '/dashboard';
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useId();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const clientId =
    (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();

  const onCredential = useCallback(
    async (resp: { credential: string }): Promise<void> => {
      setError(null);
      setBusy(true);
      try {
        const tokens = await apiClient<{ accessToken: string; refreshToken: string }>(
          '/v1/auth/google',
          { method: 'POST', body: { idToken: resp.credential } },
        );
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(tokens),
        });
        clearTokenCache();
        router.push(next);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
        setBusy(false);
      }
    },
    [router, next],
  );

  // Load the GSI script once.
  useEffect(() => {
    if (!clientId) return;
    if (window.google?.accounts?.id) { setLoaded(true); return; }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => setLoaded(true), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = (): void => setLoaded(true);
    s.onerror = (): void => setError('Could not load Google sign-in. Please check your connection.');
    document.head.appendChild(s);
  }, [clientId]);

  // Initialize + render the official Google button.
  useEffect(() => {
    if (!loaded || !clientId || !buttonRef.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: onCredential,
      auto_select: false,
      ux_mode: 'popup',
      context,
      itp_support: true,
    });
    // Clear any previous render (re-render on theme change etc.)
    buttonRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      shape: 'pill',
      theme,
      text,
      size: 'large',
      logo_alignment: 'left',
      width: buttonRef.current.clientWidth || 320,
    });
  }, [loaded, clientId, onCredential, context, theme, text]);

  if (!clientId) {
    // Hide the button entirely if not configured — don't show a broken UI.
    return <></>;
  }

  return (
    <div className="auth-google" aria-busy={busy} aria-describedby={`${widgetId}-status`}>
      <div ref={buttonRef} className="auth-google__btn" />
      {busy && (
        <p id={`${widgetId}-status`} className="auth-google__status">Signing you in with Google…</p>
      )}
      {error && (
        <p id={`${widgetId}-status`} className="auth-google__status auth-google__status--error" role="alert">
          {error}
        </p>
      )}
      <div className="auth-divider"><span>or continue with email</span></div>
    </div>
  );
}
