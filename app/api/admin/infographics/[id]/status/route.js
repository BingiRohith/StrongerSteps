import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Infographic from '@/models/Infographic';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/infographics/:id/status — one-click publish/unpublish
 * toggle, mirrors app/api/admin/blogs/[id]/status/route.js.
 * Body: { status: 'draft' | 'published' }
 */
export const PATCH = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid infographic id', 400);

  const body = await request.json();
  if (!['draft', 'published'].includes(body?.status)) {
    return fail("Status must be 'draft' or 'published'", 400);
  }

  await connectDB();
  const infographic = await Infographic.findById(params.id);
  if (!infographic) return fail('Infographic not found', 404);

  infographic.status = body.status;
  await infographic.save();

  return ok({ infographic });
});
