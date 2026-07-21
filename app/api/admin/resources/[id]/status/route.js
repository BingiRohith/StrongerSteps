import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Resource from '@/models/Resource';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/resources/:id/status — one-click publish/unpublish
 * toggle. Body: { status: 'draft' | 'published' }. Mirrors
 * app/api/admin/courses/[id]/status/route.js.
 */
export const PATCH = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid resource id', 400);

  const body = await request.json();
  if (!['draft', 'published'].includes(body?.status)) {
    return fail("Status must be 'draft' or 'published'", 400);
  }

  await connectDB();
  const resource = await Resource.findById(params.id);
  if (!resource) return fail('Resource not found', 404);

  resource.status = body.status;
  resource.updatedBy = user._id;
  await resource.save();

  return ok({ resource });
});
