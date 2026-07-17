import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import CourseCategory from '@/models/CourseCategory';
import Course from '@/models/Course';
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
  const category = await CourseCategory.findById(params.id);
  if (!category) return fail('Category not found', 404);

  return ok({ category });
});

/**
 * PUT /api/admin/course-categories/:id — partial update. Also used by the
 * admin list's reorder controls to swap `displayOrder` between two adjacent
 * categories (same pattern as Product/Recipe Categories).
 */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid category id', 400);

  await connectDB();
  const category = await CourseCategory.findById(params.id);
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
 * DELETE /api/admin/course-categories/:id — blocks with 409 if any Course
 * still references the category, same rule/reasoning as
 * app/api/admin/product-categories/[id]/route.js: Course.category is
 * `required`, so deleting an in-use category would leave those courses with
 * a dangling ref the admin UI could never fix.
 */
export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid category id', 400);

  await connectDB();

  const courseCount = await Course.countDocuments({ category: params.id });
  if (courseCount > 0) {
    return fail(
      `Cannot delete — ${courseCount} course${courseCount === 1 ? '' : 's'} still use${courseCount === 1 ? 's' : ''} this category. Reassign or delete ${courseCount === 1 ? 'it' : 'them'} first.`,
      409
    );
  }

  const category = await CourseCategory.findByIdAndDelete(params.id);
  if (!category) return fail('Category not found', 404);

  return ok({ deleted: true });
});
