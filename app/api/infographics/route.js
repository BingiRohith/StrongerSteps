import { ok, withErrorHandling } from '@/lib/apiResponse';
import { getPublishedInfographics, getInfographicCategories } from '@/lib/publicInfographics';

export const dynamic = 'force-dynamic';

/**
 * GET /api/infographics — public, unauthenticated, published-only.
 * Query params: search (text), category, page (default 1), limit (default
 * 18, max 48). Powers the Knowledge Center's client-side
 * search/filter/"load more" grid (components/infographics/InfographicsGrid.js).
 * Deliberately separate from app/api/admin/infographics/route.js, which
 * stays untouched and keeps requiring auth + returning drafts.
 */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '18', 10);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  const [{ infographics, pagination }, categories] = await Promise.all([
    getPublishedInfographics({ page, limit, search, category }),
    getInfographicCategories(),
  ]);

  return ok({ infographics, pagination, categories });
});
