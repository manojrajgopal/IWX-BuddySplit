import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, REFRESH_COOKIE } from '@/lib/auth/session';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const refreshToken = cookies().get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    await fetch(`${process.env.INTERNAL_API_URL || 'http://localhost:4000'}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }
  const res = NextResponse.redirect(new URL('/', req.url));
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}
