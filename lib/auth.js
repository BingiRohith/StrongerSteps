import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import User from '@/models/User';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'ss_token';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'Missing JWT_SECRET environment variable. Add it to your .env.local file (see .env.example).'
    );
  }
  return secret;
}

/** Sign a JWT for a given user document. */
export function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/** Verify a JWT and return its decoded payload, or null if invalid/expired. */
export function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (err) {
    return null;
  }
}

/** Set the auth cookie on a NextResponse-compatible cookie store. */
export function setAuthCookie(response, token) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days, keep in sync with JWT_EXPIRES_IN default
  });
  return response;
}

/** Clear the auth cookie on a NextResponse. */
export function clearAuthCookie(response) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

/**
 * Read the auth cookie from the incoming request (App Router route handler
 * context) and resolve the authenticated user, if any.
 * Returns null when there is no valid session.
 */
export async function getCurrentUser(request) {
  const token = request?.cookies?.get(AUTH_COOKIE_NAME)?.value
    ?? cookies().get(AUTH_COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload?.userId) return null;

  await connectDB();
  const user = await User.findById(payload.userId);
  if (!user || !user.isActive) return null;

  return user;
}

/**
 * Helper for protecting API route handlers. Usage inside a route.js:
 *
 *   const user = await requireAuth(request);
 *   if (user instanceof Response) return user; // not authenticated
 *
 * Optionally restrict to specific roles: requireAuth(request, ['admin'])
 */
export async function requireAuth(request, allowedRoles = null) {
  const user = await getCurrentUser(request);

  if (!user) {
    return Response.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return Response.json(
      { success: false, error: 'Not authorized' },
      { status: 403 }
    );
  }

  return user;
}
