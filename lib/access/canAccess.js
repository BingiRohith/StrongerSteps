import { ACCESS_LEVELS, isValidAccessLevel } from '@/lib/access/accessLevels';

/**
 * Sprint 19.1B — the single reusable authorization point every future
 * protected resource/page/API route should call, instead of scattering
 * per-module permission checks. See docs/14_ACCESS_CONTROL.md for the full
 * write-up of each level and how OTP/Membership/Purchases interact with it.
 *
 * Deliberately pure/sync and free of any request/cookie/DB import so it's
 * trivially unit-testable — see lib/access/actor.js for the request-scoped
 * `getCurrentActor()` that resolves the `actor` argument this expects.
 */

function isActiveMember(lead) {
  if (!lead?.membership) return false;
  if (!lead.membershipExpiry) return true; // no expiry set = not yet time-boxed
  return new Date(lead.membershipExpiry) > new Date();
}

function hasPurchased(lead, resourceType, resourceId) {
  if (!lead || !resourceType || !resourceId) return false;
  const list = lead.purchasedItems || [];
  return list.some((item) => item.resourceType === resourceType && String(item.resourceId) === String(resourceId));
}

/**
 * `descriptor`: { accessLevel, resourceType?, resourceId? } — a plain
 * object, not required to be a Mongoose document, so this stays testable
 * without a DB and decoupled from any one content model's shape.
 * `resourceType` is a free-text string matching whatever key a future
 * module registers its purchases/bookmarks under on `VerifiedLead.purchasedItems`
 * (same convention `models/Verification.js`'s `resourceType` already uses) —
 * not a field name, unlike the earlier per-type-array design this replaced
 * (see docs/13_DECISIONS.md).
 *
 * `actor`: { user, lead } — from getCurrentActor(request) (lib/access/actor.js).
 *
 * `{ allowAdminOverride = true }`: an authenticated admin/editor session
 * can preview any resource regardless of its access level — consistent
 * with the existing pattern where admin CRUD routes already see drafts and
 * everything else the public site hides (see docs/14_ACCESS_CONTROL.md for
 * why this is a deliberate choice, not an oversight).
 */
export function canAccess(descriptor, actor = {}, { allowAdminOverride = true } = {}) {
  const { accessLevel, resourceType, resourceId } = descriptor || {};
  const { user = null, lead = null } = actor;

  if (!isValidAccessLevel(accessLevel)) {
    return { allowed: false, reason: 'invalid-access-level' };
  }

  if (allowAdminOverride && user) {
    return { allowed: true, reason: 'admin-override' };
  }

  switch (accessLevel) {
    case ACCESS_LEVELS.PUBLIC:
      return { allowed: true, reason: 'public' };

    case ACCESS_LEVELS.ADMIN:
      return user ? { allowed: true, reason: 'admin-session' } : { allowed: false, reason: 'admin-required' };

    case ACCESS_LEVELS.OTP:
      // Not a standing grant — canAccess only signals "this resource needs
      // OTP verification." The actual per-download gate is the existing
      // short-lived signed token checked by app/api/verify/download, which
      // this function deliberately does not duplicate.
      return { allowed: false, reason: 'otp-required' };

    case ACCESS_LEVELS.MEMBER:
      return isActiveMember(lead)
        ? { allowed: true, reason: 'active-member' }
        : { allowed: false, reason: 'membership-required' };

    case ACCESS_LEVELS.PURCHASED:
      return hasPurchased(lead, resourceType, resourceId)
        ? { allowed: true, reason: 'purchased' }
        : { allowed: false, reason: 'purchase-required' };

    default:
      return { allowed: false, reason: 'invalid-access-level' };
  }
}
