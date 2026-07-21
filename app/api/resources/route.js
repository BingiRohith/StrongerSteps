import { ok, withErrorHandling } from '@/lib/apiResponse';
import { getPublishedResources } from '@/lib/publicResources';

export const dynamic = 'force-dynamic';

/**
 * GET /api/resources — public. Query: category (ResourceCategory slug),
 * fileType, tag, search, accessLevel, sort ('title-asc'|'newest'|'featured'),
 * page (default 1), limit (default 12, max 48). Published-only. Mirrors
 * GET /api/courses.
 */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);

  const result = await getPublishedResources({
    category: searchParams.get('category') || '',
    fileType: searchParams.get('fileType') || '',
    tag: searchParams.get('tag') || '',
    search: searchParams.get('search') || '',
    accessLevel: searchParams.get('accessLevel') || '',
    featured: searchParams.get('featured') === 'true',
    sort: searchParams.get('sort') || '',
    page: searchParams.get('page') || 1,
    limit: searchParams.get('limit') || 12,
  });

  return ok(result);
});
