import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Tool from '@/models/Tool';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/tools/:id/status — one-click publish/unpublish toggle.
 * Body: { status: 'draft' | 'published' }. Mirrors
 * app/api/admin/resources/[id]/status/route.js.
 */
export const PATCH = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid tool id', 400);

  const body = await request.json();
  if (!['draft', 'published'].includes(body?.status)) {
    return fail("Status must be 'draft' or 'published'", 400);
  }

  await connectDB();
  const tool = await Tool.findById(params.id);
  if (!tool) return fail('Tool not found', 404);

  tool.status = body.status;
  tool.updatedBy = user._id;
  await tool.save();

  return ok({ tool });
});
