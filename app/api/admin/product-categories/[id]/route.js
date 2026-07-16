import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import ProductCategory from '@/models/ProductCategory';
import Product from '@/models/Product';
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
  const category = await ProductCategory.findById(params.id);
  if (!category) return fail('Category not found', 404);

  return ok({ category });
});

/**
 * PUT /api/admin/product-categories/:id — partial update. Also used by the
 * admin list's reorder controls to swap `displayOrder` between two adjacent
 * categories (same pattern as Recipe Categories/Membership/Events).
 */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid category id', 400);

  await connectDB();
  const category = await ProductCategory.findById(params.id);
  if (!category) return fail('Category not found', 404);

  const body = await request.json();

  if (body.name !== undefined) {
    if (!body.name.trim()) return fail('Category name is required', 400);
    category.name = body.name;
  }
  if (body.slug !== undefined) category.slug = body.slug;
  if (body.description !== undefined) category.description = body.description;
  if (body.icon !== undefined) {
    category.icon = {
      url: body.icon?.url || '',
      alt: body.icon?.alt || '',
    };
  }
  if (body.displayOrder !== undefined) {
    category.displayOrder = Number.isFinite(body.displayOrder) ? body.displayOrder : 0;
  }
  if (body.isActive !== undefined) category.isActive = Boolean(body.isActive);

  await category.save();

  return ok({ category });
});

/**
 * DELETE /api/admin/product-categories/:id — unlike
 * RecipeCategory's delete (which allows orphaning a Recipe's category ref,
 * see docs/13_DECISIONS.md), this blocks with a 409 if any Product still
 * references the category: Product.category is `required`, so deleting an
 * in-use category would leave those products with a dangling ref that can
 * never be resolved through the admin UI again.
 */
export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid category id', 400);

  await connectDB();

  const productCount = await Product.countDocuments({ category: params.id });
  if (productCount > 0) {
    return fail(
      `Cannot delete — ${productCount} product${productCount === 1 ? '' : 's'} still use${productCount === 1 ? 's' : ''} this category. Reassign or delete ${productCount === 1 ? 'it' : 'them'} first.`,
      409
    );
  }

  const category = await ProductCategory.findByIdAndDelete(params.id);
  if (!category) return fail('Category not found', 404);

  return ok({ deleted: true });
});
