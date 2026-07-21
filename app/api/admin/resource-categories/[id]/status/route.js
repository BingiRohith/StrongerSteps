import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import ResourceCategory from '@/models/ResourceCategory';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/resource-categories/:id/status — activate/deactivate
 * toggle. Body: { isActive: boolean }. Mirrors
 * app/api/admin/course-categories/[id]/status/route.js.
 */
export const PATCH = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid category id', 400);

  const body = await request.json();
  if (typeof body?.isActive !== 'boolean') return fail('isActive must be a boolean', 400);

  await connectDB();
  const category = await ResourceCategory.findById(params.id);
  if (!category) return fail('Category not found', 404);

  category.isActive = body.isActive;
  await category.save();

  return ok({ category });
});
