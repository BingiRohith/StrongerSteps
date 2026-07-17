import { getCurrentUser } from '@/lib/auth';
import { getCurrentLead } from '@/lib/access/leadSession';

/**
 * Resolves both possible identities for the current request in one call —
 * the request-scoped half of the access-control layer (needs `next/headers`
 * + DB via lib/auth.js and lib/access/leadSession.js), kept separate from
 * the pure lib/access/canAccess.js so that function stays unit-testable.
 */
export async function getCurrentActor(request) {
  const [user, lead] = await Promise.all([
    getCurrentUser(request),
    getCurrentLead(request),
  ]);
  return { user, lead };
}
