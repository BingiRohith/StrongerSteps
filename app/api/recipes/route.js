import { ok, withErrorHandling } from '@/lib/apiResponse';
import { getPublishedRecipes } from '@/lib/publicRecipes';

export const dynamic = 'force-dynamic';

/**
 * GET /api/recipes — public, unauthenticated, published-only. Query params:
 * category (slug), tag, difficulty, search, sort ('name-asc'|'newest'|'featured'),
 * page (default 1), limit (default 12, max 48). Filtering/sorting/pagination
 * are all server-side. Category/tag facets are fetched once by the server
 * page via lib/publicRecipes.js (not recomputed on every request here) —
 * same pattern as the Products marketplace (Sprint 12.5). Deliberately
 * separate from app/api/admin/recipes/route.js, which stays untouched and
 * keeps requiring auth + returning drafts.
 */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);

  const { recipes, pagination } = await getPublishedRecipes({
    category: searchParams.get('category') || '',
    tag: searchParams.get('tag') || '',
    difficulty: searchParams.get('difficulty') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || '',
    page: searchParams.get('page') || 1,
    limit: searchParams.get('limit') || 12,
  });

  return ok({ recipes, pagination });
});
