import { ok, withErrorHandling } from '@/lib/apiResponse';
import { getPublishedTools } from '@/lib/publicTools';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tools — public. Query: category (ToolCategory slug), tag,
 * toolType, search, accessLevel, featured, sort
 * ('title-asc'|'newest'|'featured'), page (default 1), limit (default 12,
 * max 48). Published-only. Mirrors GET /api/resources.
 */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);

  const result = await getPublishedTools({
    category: searchParams.get('category') || '',
    tag: searchParams.get('tag') || '',
    toolType: searchParams.get('toolType') || '',
    search: searchParams.get('search') || '',
    accessLevel: searchParams.get('accessLevel') || '',
    featured: searchParams.get('featured') === 'true',
    sort: searchParams.get('sort') || '',
    page: searchParams.get('page') || 1,
    limit: searchParams.get('limit') || 12,
  });

  return ok(result);
});
