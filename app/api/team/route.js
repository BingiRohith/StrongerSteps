import { ok, withErrorHandling } from '@/lib/apiResponse';
import { getPublishedTeamMembers, getTeamTree } from '@/lib/publicTeam';

export const dynamic = 'force-dynamic';

/**
 * GET /api/team — public, unauthenticated, published-only. Query params:
 * search (matches Name/Department/Position). No pagination — team rosters
 * stay small. Deliberately separate from app/api/admin/team/route.js, which
 * stays untouched and keeps requiring auth + returning drafts.
 *
 * Returns both the flat `teamMembers` list (unchanged shape, Sprint 9 —
 * kept for backward compatibility) and the Sprint 14 `tree`/`matchedIds`
 * pair the public Organization Tree component renders.
 */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  const [teamMembers, { tree, matchedIds }] = await Promise.all([
    getPublishedTeamMembers({ search }),
    getTeamTree({ search }),
  ]);

  return ok({ teamMembers, tree, matchedIds });
});
