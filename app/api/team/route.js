import { ok, withErrorHandling } from '@/lib/apiResponse';
import { getPublishedTeamMembers, getTeamTreeData } from '@/lib/publicTeam';

export const dynamic = 'force-dynamic';

/**
 * GET /api/team — public, unauthenticated, published-only. Query params:
 * search (matches Name/Department/Position). No pagination — team rosters
 * stay small. Deliberately separate from app/api/admin/team/route.js, which
 * stays untouched and keeps requiring auth + returning drafts.
 *
 * Returns the flat `teamMembers` list (unchanged shape, Sprint 9 — kept for
 * backward compatibility, `search` filters it) alongside the Sprint 14
 * `treeMembers`/`matchedIds` pair the illustrated Organization Tree
 * component renders (`treeMembers` is always the *full* published roster —
 * `search` only flags `matchedIds` for highlighting, never removes a member
 * from the illustration).
 */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  const [teamMembers, { members: treeMembers, matchedIds }] = await Promise.all([
    getPublishedTeamMembers({ search }),
    getTeamTreeData({ search }),
  ]);

  return ok({ teamMembers, treeMembers, matchedIds });
});
