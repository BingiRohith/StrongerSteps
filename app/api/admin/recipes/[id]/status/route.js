import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Recipe from '@/models/Recipe';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/recipes/:id/status — one-click publish/unpublish toggle,
 * mirrors app/api/admin/products/[id]/status/route.js.
 * Body: { status: 'draft' | 'published' }
 */
export const PATCH = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid recipe id', 400);

  const body = await request.json();
  if (!['draft', 'published'].includes(body?.status)) {
    return fail("Status must be 'draft' or 'published'", 400);
  }

  await connectDB();
  const recipe = await Recipe.findById(params.id);
  if (!recipe) return fail('Recipe not found', 404);

  recipe.status = body.status;
  await recipe.save();

  return ok({ recipe });
});
