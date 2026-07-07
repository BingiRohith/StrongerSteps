import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Membership from '@/models/Membership';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/membership/:id/status — one-click active/inactive
 * toggle, mirrors app/api/admin/products/[id]/status/route.js.
 * Body: { status: 'active' | 'inactive' }
 */
export const PATCH = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid plan id', 400);

  const body = await request.json();
  if (!['active', 'inactive'].includes(body?.status)) {
    return fail("Status must be 'active' or 'inactive'", 400);
  }

  await connectDB();
  const plan = await Membership.findById(params.id);
  if (!plan) return fail('Plan not found', 404);

  plan.status = body.status;
  await plan.save();

  return ok({ plan });
});
