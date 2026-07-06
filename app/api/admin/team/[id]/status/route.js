import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Team from '@/models/Team';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/team/:id/status — one-click publish/unpublish toggle,
 * mirrors app/api/admin/infographics/[id]/status/route.js.
 * Body: { status: 'draft' | 'published' }
 */
export const PATCH = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid team member id', 400);

  const body = await request.json();
  if (!['draft', 'published'].includes(body?.status)) {
    return fail("Status must be 'draft' or 'published'", 400);
  }

  await connectDB();
  const teamMember = await Team.findById(params.id);
  if (!teamMember) return fail('Team member not found', 404);

  teamMember.status = body.status;
  await teamMember.save();

  return ok({ teamMember });
});
