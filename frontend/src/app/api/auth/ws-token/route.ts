import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/auth/session';

/** Returns the current access token to the client so it can open a websocket. */
export async function GET(): Promise<NextResponse> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ token: null }, { status: 401 });
  return NextResponse.json({ token });
}
