import { ok, withErrorHandling } from '@/lib/apiResponse';
import { getActiveMembershipPlans } from '@/lib/publicMembership';

export const dynamic = 'force-dynamic';

/**
 * GET /api/membership — public, unauthenticated, active-only. No query
 * params, no pagination — the plan catalog stays small. Deliberately
 * separate from app/api/admin/membership/route.js, which stays
 * authenticated and returns inactive plans too. Mirrors app/api/products.
 */
export const GET = withErrorHandling(async () => {
  const plans = await getActiveMembershipPlans();

  return ok({ plans });
});
