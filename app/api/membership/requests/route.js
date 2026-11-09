import mongoose from 'mongoose';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { getCurrentLead } from '@/lib/access/leadSession';
import {
  createMembershipRequest,
  listSubscriptionsForLead,
  MembershipRequestConflictError,
  MembershipStateError,
} from '@/lib/membershipSubscription';

export const dynamic = 'force-dynamic';

/**
 * POST /api/membership/requests — public, lead-scoped. Body: { planId }.
 * Requires an existing lead session (the OTP step, via VerificationModal +
 * the existing /api/verify/* flow, must run first — same "verify once"
 * pattern every other OTP-gated action already uses). Creates a `pending`
 * MembershipSubscription; admin activation happens separately
 * (app/api/admin/members/[id]/status/route.js) until Sprint 19.7b.
 */
export const POST = withErrorHandling(async (request) => {
  const lead = await getCurrentLead(request);
  if (!lead) {
    return fail('Please verify your email or mobile number first.', 401);
  }

  const body = await request.json();
  const { planId } = body || {};
  if (!mongoose.Types.ObjectId.isValid(planId)) {
    return fail('A valid planId is required', 400);
  }

  try {
    const subscription = await createMembershipRequest({ leadId: lead._id, planId });
    return ok({ subscription: subscription.toSafeObject() }, 201);
  } catch (err) {
    if (err instanceof MembershipRequestConflictError) {
      return fail(err.message, 409);
    }
    if (err instanceof MembershipStateError) {
      return fail(err.message, err.status || 409);
    }
    throw err;
  }
});

/**
 * GET /api/membership/requests — public, lead-scoped. Returns the current
 * lead's subscription history, newest first — feeds the Member Dashboard's
 * subscription history card.
 */
export const GET = withErrorHandling(async (request) => {
  const lead = await getCurrentLead(request);
  if (!lead) {
    return ok({ subscriptions: [] });
  }

  const subscriptions = await listSubscriptionsForLead(lead._id);
  return ok({ subscriptions });
});
