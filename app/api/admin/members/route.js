import { requireAuth } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { listMembershipSubscriptions } from '@/lib/membershipSubscription';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/members — paginated list of MembershipSubscriptions
 * (mirrors app/api/admin/blogs/route.js's page/limit pagination).
 * Query params: page, limit, search (lead name/email/mobile or plan name),
 * status (pending|active|expired|cancelled).
 *
 * Deliberately separate from app/api/admin/membership/* (the plan
 * catalog's own CRUD) — this manages member subscriptions, not plans.
 */
export const GET = withErrorHandling(async (request) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  const { searchParams } = new URL(request.url);
  const result = await listMembershipSubscriptions({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
  });

  return ok(result);
});
