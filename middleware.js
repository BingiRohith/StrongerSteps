import { NextResponse } from 'next/server';

/**
 * Lightweight edge-safe gate for the (future) admin panel UI.
 *
 * This only checks for the *presence* of the session cookie so it can run
 * on the Edge runtime (the `jsonwebtoken` verification itself happens in
 * Node runtime API routes via lib/auth.js -> requireAuth/getCurrentUser).
 * Treat this as a fast redirect for signed-out visitors, not the source of
 * truth for authorization — every protected API route still verifies the
 * token itself.
 */
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'ss_token';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // The login page itself must stay reachable while signed out, or every
  // visitor gets bounced in an infinite redirect loop.
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  if (pathname.startsWith('/admin') && !hasSession) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Scoped to the future admin panel only — does not touch any existing
  // public pages or API routes built today.
  matcher: ['/admin/:path*'],
};
