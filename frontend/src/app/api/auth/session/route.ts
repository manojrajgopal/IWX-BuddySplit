import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, REFRESH_COOKIE } from '@/lib/auth/session';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { accessToken, refreshToken } = (await req.json().catch(() => ({}))) as { accessToken?: string; refreshToken?: string };
  if (!accessToken || !refreshToken) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
  const res = NextResponse.json({ success: true });
  const secure = process.env.NODE_ENV === 'production';
  res.cookies.set(SESSION_COOKIE, accessToken, {
    httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 60 * 60,
  });
  res.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE(): Promise<NextResponse> {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}
