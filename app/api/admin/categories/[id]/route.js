import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Blog from '@/models/Blog';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/** Return one category for the edit screen. */
export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  const { id } = await params;
  if (!isValidId(id)) return fail('Invalid category id', 400);

  await connectDB();
  const category = await Category.findById(id);
  if (!category) return fail('Category not found', 404);

  return ok({ category });
});

/** Update the name, public URL slug, or optional description. */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  const { id } = await params;
  if (!isValidId(id)) return fail('Invalid category id', 400);

  await connectDB();
  const category = await Category.findById(id);
  if (!category) return fail('Category not found', 404);

  const body = await request.json();
  if (body.name !== undefined) {
    if (!body.name?.trim()) return fail('Category name is required', 400);
    category.name = body.name.trim();
  }
  if (body.slug !== undefined) category.slug = body.slug?.trim() || '';
  if (body.description !== undefined) category.description = body.description?.trim() || '';

  await category.save();
  return ok({ category });
});

/**
 * Delete only unused categories. Blog.category is required, so allowing an
 * in-use category to disappear would leave existing articles with a broken
 * reference and no valid category in the editor.
 */
export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  const { id } = await params;
  if (!isValidId(id)) return fail('Invalid category id', 400);

  await connectDB();
  const blogCount = await Blog.countDocuments({ category: id });
  if (blogCount > 0) {
    return fail(
      `Cannot delete — ${blogCount} blog${blogCount === 1 ? '' : 's'} still use${blogCount === 1 ? 's' : ''} this category. Reassign or delete ${blogCount === 1 ? 'it' : 'them'} first.`,
      409
    );
  }

  const category = await Category.findByIdAndDelete(id);
  if (!category) return fail('Category not found', 404);

  return ok({ deleted: true });
});
