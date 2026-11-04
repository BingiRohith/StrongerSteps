import { isActiveMember } from '@/lib/access/canAccess';

/**
 * Sprint 19.7a — the single centralized "what is this visitor's membership
 * standing" helper (objective: avoid duplicated access logic across the
 * dashboard, GET /api/me, and the Members Only dialog). Reuses
 * isActiveMember() from lib/access/canAccess.js rather than re-implementing
 * the active-membership check a second time.
 *
 * `lead` is a plain VerifiedLead-shaped object (doc or .lean()), same
 * convention as canAccess()'s `actor.lead` — or null/undefined for a
 * visitor with no lead session at all.
 *
 * Four states only — this is an *access* status, not the richer
 * MembershipSubscription.status lifecycle (pending/active/expired/
 * cancelled). A lead with a `pending` request is still 'registered' from
 * an access standpoint; the UI shows the pending detail separately from
 * this helper by reading the subscription record directly.
 */
export const MEMBERSHIP_STATUSES = {
  GUEST: 'guest',
  REGISTERED: 'registered',
  ACTIVE_MEMBER: 'active_member',
  EXPIRED_MEMBER: 'expired_member',
};

export function getMembershipStatus(lead) {
  if (!lead) return MEMBERSHIP_STATUSES.GUEST;
  if (isActiveMember(lead)) return MEMBERSHIP_STATUSES.ACTIVE_MEMBER;
  // membershipExpiry is only ever set once a membership existed (see
  // lib/membershipSubscription.js) — its presence even after lapsing is
  // what distinguishes "had one, now expired" from "never had one."
  if (lead.membershipExpiry) return MEMBERSHIP_STATUSES.EXPIRED_MEMBER;
  return MEMBERSHIP_STATUSES.REGISTERED;
}
