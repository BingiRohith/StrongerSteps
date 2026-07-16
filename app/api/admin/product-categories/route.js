import connectDB from '@/lib/db';
import ProductCategory from '@/models/ProductCategory';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/product-categories
 * Query params: isActive ('true'|'false'), search (name/description regex).
 * No pagination — the category list stays small, same convention as
 * app/api/admin/recipe-categories/route.js.
 */
export const GET = withErrorHandling(async (request) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const isActive = searchParams.get('isActive');
  const search = searchParams.get('search')?.trim();

  const query = {};
  if (isActive === 'true') query.isActive = true;
  if (isActive === 'false') query.isActive = false;
  if (search) query.name = { $regex: search, $options: 'i' };

  const categories = await ProductCategory.find(query)
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  return ok({ categories });
});

/**
 * POST /api/admin/product-categories
 * Body: { name (required), slug?, description?, icon?, displayOrder?, isActive? }
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  await connectDB();

  const body = await request.json();
  if (!body?.name?.trim()) return fail('Category name is required', 400);

  const category = await ProductCategory.create({
    name: body.name,
    slug: body.slug || undefined,
    description: body.description || '',
    icon: {
      url: body.icon?.url || '',
      alt: body.icon?.alt || '',
    },
    displayOrder: Number.isFinite(body.displayOrder) ? body.displayOrder : 0,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
  });

  return ok({ category }, 201);
});
