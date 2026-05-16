import { cookies } from 'next/headers';
import { apiServer } from '@/lib/api/server';

export interface SessionUser { id: string; email: string; role: 'user' | 'admin' }

export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || 'bs_session';
export const REFRESH_COOKIE = (process.env.SESSION_COOKIE_NAME || 'bs_session') + '_r';

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const me = await apiServer<SessionUser>('/v1/auth/me', {
      method: 'POST',
      revalidate: false,
    });
    return me;
  } catch {
    return null;
  }
}
