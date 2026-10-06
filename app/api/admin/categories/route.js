import connectDB from '@/lib/db';
import Category from '@/models/Category';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/categories — the shared category list for the Blog editor
 * and Blog Categories admin screen. The optional search query is used only
 * by the management screen; callers without it still receive the full list.
 */
export const GET = withErrorHandling(async (request) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  await connectDB();
  const search = new URL(request.url).searchParams.get('search')?.trim();
  const escapedSearch = search?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const query = escapedSearch
    ? {
        $or: [
          { name: { $regex: escapedSearch, $options: 'i' } },
          { description: { $regex: escapedSearch, $options: 'i' } },
        ],
      }
    : {};

  const categories = await Category.find(query).sort({ name: 1 }).lean();

  return ok({ categories });
});

/**
 * POST /api/admin/categories — creates a category from either the full
 * management form or the Blog editor's compact "+ New category" control.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  await connectDB();
  const body = await request.json();

  if (!body?.name?.trim()) return fail('Category name is required', 400);

  const category = await Category.create({
    name: body.name.trim(),
    slug: body.slug?.trim() || undefined,
    description: body.description || '',
  });

  return ok({ category }, 201);
});
