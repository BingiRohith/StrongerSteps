import { ok, withErrorHandling } from '@/lib/apiResponse';
import { getPublishedTeamMembers } from '@/lib/publicTeam';

export const dynamic = 'force-dynamic';

/**
 * GET /api/team — public, unauthenticated, published-only. Query params:
 * search (matches Name/Department/Position). No pagination — team rosters
 * stay small. Deliberately separate from app/api/admin/team/route.js, which
 * stays untouched and keeps requiring auth + returning drafts.
 *
 * Sprint 19.4 — returns only the flat `teamMembers` list (unchanged shape,
 * Sprint 9). The Sprint 14 `treeMembers`/`matchedIds` pair existed only to
 * feed the illustrated Organization Tree, removed this sprint in favor of a
 * flat card grid (components/team/TeamGrid.js) — dropped rather than kept
 * as dead weight.
 */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  const teamMembers = await getPublishedTeamMembers({ search });

  return ok({ teamMembers });
});
