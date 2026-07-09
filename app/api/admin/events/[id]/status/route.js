import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Event from '@/models/Event';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/events/:id/status — one-click draft/published toggle,
 * mirrors app/api/admin/products/[id]/status/route.js.
 * Body: { status: 'draft' | 'published' }
 */
export const PATCH = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid event id', 400);

  const body = await request.json();
  if (!['draft', 'published'].includes(body?.status)) {
    return fail("Status must be 'draft' or 'published'", 400);
  }

  await connectDB();
  const event = await Event.findById(params.id);
  if (!event) return fail('Event not found', 404);

  event.status = body.status;
  await event.save();

  return ok({ event });
});
