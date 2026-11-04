import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import MembershipSubscription from '@/models/MembershipSubscription';
import '@/models/VerifiedLead';
import '@/models/Membership';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/members/:id — detail view for one MembershipSubscription,
 * populated lead + plan, for the admin member detail page.
 */
export const GET = withErrorHandling(async (request, { params }) => {
  params = await params;
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid subscription id', 400);

  await connectDB();
  const subscription = await MembershipSubscription.findById(params.id)
    .populate('lead')
    .populate('plan')
    .lean();
  if (!subscription) return fail('Membership subscription not found', 404);

  return ok({ subscription });
});
