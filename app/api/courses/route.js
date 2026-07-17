import { ok, withErrorHandling } from '@/lib/apiResponse';
import { getPublishedCourses } from '@/lib/publicCourses';

export const dynamic = 'force-dynamic';

/**
 * GET /api/courses — public. Query: category (CourseCategory slug),
 * difficulty, tag, search, sort ('title-asc'|'newest'|'featured'), page
 * (default 1), limit (default 12, max 48). Published-only. Mirrors
 * GET /api/recipes.
 */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);

  const result = await getPublishedCourses({
    category: searchParams.get('category') || '',
    difficulty: searchParams.get('difficulty') || '',
    tag: searchParams.get('tag') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || '',
    page: searchParams.get('page') || 1,
    limit: searchParams.get('limit') || 12,
  });

  return ok(result);
});
