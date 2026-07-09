import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import RecipeCategory from '@/models/RecipeCategory';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid category id', 400);

  await connectDB();
  const category = await RecipeCategory.findById(params.id);
  if (!category) return fail('Category not found', 404);

  return ok({ category });
});

/**
 * PUT /api/admin/recipe-categories/:id — partial update. Also used by the
 * admin list's reorder controls to swap `displayOrder` between two adjacent
 * categories (same pattern as Membership/Events).
 */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid category id', 400);

  await connectDB();
  const category = await RecipeCategory.findById(params.id);
  if (!category) return fail('Category not found', 404);

  const body = await request.json();

  if (body.name !== undefined) {
    if (!body.name.trim()) return fail('Category name is required', 400);
    category.name = body.name;
  }
  if (body.slug !== undefined) category.slug = body.slug;
  if (body.description !== undefined) category.description = body.description;
  if (body.featuredImage !== undefined) {
    category.featuredImage = {
      url: body.featuredImage?.url || '',
      alt: body.featuredImage?.alt || '',
    };
  }
  if (body.displayOrder !== undefined) {
    category.displayOrder = Number.isFinite(body.displayOrder) ? body.displayOrder : 0;
  }
  if (body.isActive !== undefined) category.isActive = Boolean(body.isActive);

  await category.save();

  return ok({ category });
});

export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid category id', 400);

  await connectDB();
  const category = await RecipeCategory.findByIdAndDelete(params.id);
  if (!category) return fail('Category not found', 404);

  return ok({ deleted: true });
});
