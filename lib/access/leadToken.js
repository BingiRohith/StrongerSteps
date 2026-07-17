import jwt from 'jsonwebtoken';

/**
 * Pure JWT/cookie mechanics for the lead session — deliberately has no
 * `next/headers` import (unlike lib/access/leadSession.js, which wraps
 * this with the request-cookie-fallback + DB lookup), so this half can be
 * unit-tested with plain `node --test` and reused anywhere a Next.js
 * request-scoped `cookies()` isn't available or needed.
 */
const LEAD_TOKEN_PURPOSE = 'lead';
const LEAD_SESSION_EXPIRES_IN = process.env.LEAD_SESSION_EXPIRES_IN || '180d';
export const LEAD_COOKIE_NAME = process.env.LEAD_COOKIE_NAME || 'ss_lead';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET environment variable. Add it to your .env.local file (see .env.example).');
  }
  return secret;
}

/** Sign a lead-session JWT for a given VerifiedLead document/id. */
export function signLeadToken(lead) {
  const leadId = typeof lead === 'string' ? lead : lead._id.toString();
  return jwt.sign({ purpose: LEAD_TOKEN_PURPOSE, leadId }, getJwtSecret(), {
    expiresIn: LEAD_SESSION_EXPIRES_IN,
  });
}

/** Verify a lead-session JWT, rejecting tokens signed for a different purpose (e.g. the admin or download token). */
export function verifyLeadToken(token) {
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (payload.purpose !== LEAD_TOKEN_PURPOSE || !payload.leadId) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

/** Set the lead session cookie on a NextResponse-compatible cookie store. */
export function setLeadCookie(response, token) {
  response.cookies.set({
    name: LEAD_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 180, // 180 days, keep in sync with LEAD_SESSION_EXPIRES_IN default
  });
  return response;
}

export function clearLeadCookie(response) {
  response.cookies.set({
    name: LEAD_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
