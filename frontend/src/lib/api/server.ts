/* Server-side API fetcher with cache tags + auth. */
import { cookies } from 'next/headers';

const BASE = process.env.INTERNAL_API_URL || 'http://localhost:4000';

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Cache tags for `revalidateTag()`. Server-only. */
  tags?: string[];
  revalidate?: number | false;
  /** Use cached cookie session if true (default). */
  withAuth?: boolean;
  /** Throw on non-2xx (default true). */
  throwOnError?: boolean;
}

export interface ApiEnvelope<T> { success: boolean; data: T; error?: unknown }

export async function apiServer<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const url = `${BASE}/api${path.startsWith('/') ? path : '/' + path}`;
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.withAuth !== false) {
    const cookieStore = await cookies();
    const token = cookieStore.get(process.env.SESSION_COOKIE_NAME || 'bs_session')?.value;
    if (token) headers.authorization = `Bearer ${token}`;
  }
  const fetchOpts: RequestInit & { next?: { tags?: string[]; revalidate?: number | false } } =
    opts.revalidate === false
      ? { cache: 'no-store' }
      : { next: { tags: opts.tags, revalidate: opts.revalidate ?? false } };
  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    headers,
    ...fetchOpts,
  });
  const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T> | undefined;
  if (!res.ok) {
    if (opts.throwOnError === false) return undefined as unknown as T;
    const message = (json?.error as { message?: string })?.message ?? `HTTP ${res.status}`;
    throw new Error(message);
  }
  return (json?.data as T) ?? (json as unknown as T);
}
