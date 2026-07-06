import { ok, withErrorHandling } from '@/lib/apiResponse';
import { getPublishedTeamMembers } from '@/lib/publicTeam';

export const dynamic = 'force-dynamic';

/**
 * GET /api/team — public, unauthenticated, published-only. Query params:
 * search (text). No pagination — team rosters stay small. Deliberately
 * separate from app/api/admin/team/route.js, which stays untouched and
 * keeps requiring auth + returning drafts.
 */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  const teamMembers = await getPublishedTeamMembers({ search });

  return ok({ teamMembers });
});
