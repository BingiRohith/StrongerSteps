import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/courses/:id/status — one-click publish/unpublish toggle.
 * Body: { status: 'draft' | 'published' }
 */
export const PATCH = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid course id', 400);

  const body = await request.json();
  if (!['draft', 'published'].includes(body?.status)) {
    return fail("Status must be 'draft' or 'published'", 400);
  }

  await connectDB();
  const course = await Course.findById(params.id);
  if (!course) return fail('Course not found', 404);

  course.status = body.status;
  course.updatedBy = user._id;
  await course.save();

  return ok({ course });
});
