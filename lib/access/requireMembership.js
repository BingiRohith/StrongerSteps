import { getCurrentLead } from '@/lib/access/leadSession';
import { isActiveMember } from '@/lib/access/canAccess';

/**
 * Sprint 19.7a — centralizes the "does this request have an active
 * membership" check for API routes, mirroring lib/auth.js's requireAuth()
 * shape exactly:
 *
 *   const lead = await requireActiveMember(request);
 *   if (lead instanceof Response) return lead; // 401/403 short-circuit
 *
 * This is deliberately a plain server-side guard function, not an
 * expansion of middleware.js's Edge matcher — see docs/14_ACCESS_CONTROL.md
 * for why the Edge middleware stays scoped to /admin/:path* only.
 */
export async function requireActiveMember(request) {
  const lead = await getCurrentLead(request);

  if (!lead) {
    return Response.json({ success: false, error: 'lead-required' }, { status: 401 });
  }

  if (!isActiveMember(lead)) {
    return Response.json({ success: false, error: 'membership-required' }, { status: 403 });
  }

  return lead;
}
