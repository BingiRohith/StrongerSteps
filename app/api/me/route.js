import { ok, withErrorHandling } from '@/lib/apiResponse';
import connectDB from '@/lib/db';
import Membership from '@/models/Membership';
import { getCurrentLead } from '@/lib/access/leadSession';
import { getMembershipStatus, MEMBERSHIP_STATUSES } from '@/lib/access/membershipStatus';
import { getLatestSubscriptionForLead } from '@/lib/membershipSubscription';
import { listMembershipPayments } from '@/lib/payments/membershipPayments';

export const dynamic = 'force-dynamic';

/**
 * GET /api/me — public, never 401s. The single reusable "who am I"
 * endpoint for authenticated frontend pages (Member Dashboard, Members
 * Only dialog) and future mobile/API clients — resolves whatever lead
 * session exists and reports its membership standing consistently, so no
 * page duplicates its own version of this lookup. A guest visitor simply
 * gets `lead: null` and `membership.status: 'guest'`.
 */
export const GET = withErrorHandling(async (request) => {
  const lead = await getCurrentLead(request);
  const status = getMembershipStatus(lead);

  let plan = null;
  if (lead?.membership) {
    await connectDB();
    plan = await Membership.findById(lead.membership).lean();
  }

  const subscription = lead ? await getLatestSubscriptionForLead(lead._id) : null;

  return ok({
    lead: lead ? lead.toSafeObject() : null,
    membership: {
      status,
      plan,
      expiresAt: lead?.membershipExpiry ?? null,
    },
    subscription,
    payments: lead ? await listMembershipPayments(lead._id) : [],
    permissions: {
      isGuest: status === MEMBERSHIP_STATUSES.GUEST,
      isRegistered: status === MEMBERSHIP_STATUSES.REGISTERED,
      isActiveMember: status === MEMBERSHIP_STATUSES.ACTIVE_MEMBER,
      isExpiredMember: status === MEMBERSHIP_STATUSES.EXPIRED_MEMBER,
    },
  });
});
