import mongoose from 'mongoose';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import {
  activateMembershipSubscription,
  expireMembershipSubscription,
  cancelMembershipSubscription,
  MembershipStateError,
} from '@/lib/membershipSubscription';

export const dynamic = 'force-dynamic';

const ACTIONS = {
  activate: (id, body) => activateMembershipSubscription(id, { expiresAt: body?.expiresAt }),
  expire: (id) => expireMembershipSubscription(id),
  cancel: (id) => cancelMembershipSubscription(id),
};

/**
 * PATCH /api/admin/members/:id/status — dispatches to
 * lib/membershipSubscription.js's activate/expire/cancel functions, same
 * shape as app/api/admin/blogs/[id]/status/route.js. Body:
 * { action: 'activate' | 'expire' | 'cancel', expiresAt? }.
 *
 * Every action is a valid-state-transition-only operation — a duplicate
 * or out-of-order action (e.g. activating an already-active subscription)
 * returns a clear 409 conflict rather than silently reprocessing, per
 * lib/membershipSubscription.js's idempotency design.
 */
export const PATCH = withErrorHandling(async (request, { params }) => {
  params = await params;
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid subscription id', 400);

  const body = await request.json();
  const action = body?.action;
  if (!Object.hasOwn(ACTIONS, action)) {
    return fail("Action must be 'activate', 'expire', or 'cancel'", 400);
  }

  try {
    const subscription = await ACTIONS[action](params.id, body);
    return ok({ subscription: subscription.toSafeObject() });
  } catch (err) {
    if (err instanceof MembershipStateError) {
      return fail(err.message, err.status || 409);
    }
    throw err;
  }
});
