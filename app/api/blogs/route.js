import { ok, withErrorHandling } from '@/lib/apiResponse';
import { getPublishedBlogs, getBlogCategories } from '@/lib/publicBlogs';

export const dynamic = 'force-dynamic';

/**
 * GET /api/blogs — public, unauthenticated, published-only.
 * Query params: search (text), category (id), page (default 1), limit
 * (default 9, max 24). Powers the Knowledge Center's client-side
 * search/filter/"load more" grid (`components/blog/BlogGrid.js`).
 *
 * Deliberately separate from `app/api/admin/blogs/route.js`, which stays
 * untouched and keeps requiring auth + returning drafts.
 */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '9', 10);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  const [{ blogs, pagination }, categories] = await Promise.all([
    getPublishedBlogs({ page, limit, search, category }),
    getBlogCategories(),
  ]);

  return ok({ blogs, pagination, categories });
});
