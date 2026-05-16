'use client';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ClientApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
}

let _tokenPromise: Promise<string | null> | null = null;

function fetchAccessToken(): Promise<string | null> {
  if (!_tokenPromise) {
    _tokenPromise = fetch('/api/auth/ws-token')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.token ?? null)
      .catch(() => null);
  }
  return _tokenPromise;
}

/** Call after login or logout to clear the cached token. */
export function clearTokenCache(): void {
  _tokenPromise = null;
}

export async function apiClient<T>(path: string, opts: ClientApiOptions = {}): Promise<T> {
  const url = `${BASE}/api${path.startsWith('/') ? path : '/' + path}`;
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.token) {
    headers.authorization = `Bearer ${opts.token}`;
  } else {
    const autoToken = await fetchAccessToken();
    if (autoToken) headers.authorization = `Bearer ${autoToken}`;
  }
  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    headers,
    credentials: 'include',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json?.error?.message as string | undefined) ?? `HTTP ${res.status}`;
    throw new Error(message);
  }
  return (json?.data ?? json) as T;
}
