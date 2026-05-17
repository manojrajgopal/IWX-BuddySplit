import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || 'bs_session';

export function middleware(request: NextRequest): NextResponse {
  // Inject Authorization header from session cookie for backend proxy requests
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && !request.headers.get('authorization')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('authorization', `Bearer ${token}`);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/backend/:path*',
};
