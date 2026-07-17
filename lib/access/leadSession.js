import { cookies } from 'next/headers';
import { resolveActiveLead } from '@/lib/verifiedLead';
import { LEAD_COOKIE_NAME, verifyLeadToken } from '@/lib/access/leadToken';

// Re-exported so existing callers can keep importing everything from this
// one module — see lib/access/leadToken.js for the pure half (no
// next/headers import, independently unit-tested).
export {
  LEAD_COOKIE_NAME,
  signLeadToken,
  verifyLeadToken,
  setLeadCookie,
  clearLeadCookie,
} from '@/lib/access/leadToken';

/**
 * Resolves the current request's VerifiedLead, or null. Always resolves
 * through the merge tombstone chain (lib/verifiedLead.js's
 * resolveActiveLead) so a session issued before a merge still lands on the
 * correct, canonical lead afterwards.
 */
export async function getCurrentLead(request) {
  const token = request?.cookies?.get(LEAD_COOKIE_NAME)?.value
    ?? cookies().get(LEAD_COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = verifyLeadToken(token);
  if (!payload?.leadId) return null;

  return resolveActiveLead(payload.leadId);
}
