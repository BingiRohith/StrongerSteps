import connectDB from '@/lib/db';
import Category from '@/models/Category';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/categories — full list, sorted alphabetically.
 * Powers the Blog form's category <select>. Full category CRUD management
 * (edit/delete/reorder) is out of scope for this sprint; this route only
 * covers what the Blog Management module needs.
 */
export const GET = withErrorHandling(async (request) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  await connectDB();
  const categories = await Category.find({}).sort({ name: 1 }).lean();

  return ok({ categories });
});

/**
 * POST /api/admin/categories — quick-create, used by the "+ New category"
 * option inline in the Blog form so authors aren't blocked waiting on a
 * separate Categories management page.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  await connectDB();
  const body = await request.json();

  if (!body?.name?.trim()) return fail('Category name is required', 400);

  const category = await Category.create({
    name: body.name.trim(),
    description: body.description || '',
  });

  return ok({ category }, 201);
});
