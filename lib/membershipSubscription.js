import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import MembershipSubscription from '@/models/MembershipSubscription';
import Membership from '@/models/Membership';
import VerifiedLead from '@/models/VerifiedLead';
import { escapeRegex } from '@/lib/escapeRegex';

/**
 * Sprint 19.7a — the membership request/activation lifecycle sitting on
 * top of models/MembershipSubscription.js. Every state-changing export
 * below is idempotent and race-safe by design (see the plan review this
 * sprint was built against): duplicate requests and duplicate admin
 * actions surface a clear conflict instead of silently reprocessing or
 * corrupting state, and every write touching both MembershipSubscription
 * and VerifiedLead is wrapped in a Mongo transaction (Atlas runs as a
 * replica set, so multi-document transactions are available) so a
 * mid-operation failure can't leave the two collections out of sync.
 *
 * Mirrors lib/verifiedLead.js's "explicit function, no silent
 * auto-trigger" convention — nothing here runs on a schedule/cron.
 */

/** Thrown for "you already have one of these" — expected to map to a 409. */
export class MembershipRequestConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MembershipRequestConflictError';
  }
}

/** Thrown for an invalid state transition or a missing referenced doc — expected to map to a 409/404. */
export class MembershipStateError extends Error {
  constructor(message, status = 409) {
    super(message);
    this.name = 'MembershipStateError';
    this.status = status;
  }
}

/**
 * Adds the plan's billing period to `from` (default now). `one-time`/`free`
 * plans never expire — mirrors VerifiedLead.membershipExpiry's own "no
 * expiry set = not yet time-boxed" convention, read directly by
 * lib/access/canAccess.js's isActiveMember().
 */
export function computeExpiryFromBillingPeriod(billingPeriod, from = new Date()) {
  const base = new Date(from);
  const months = { monthly: 1, quarterly: 3, yearly: 12 }[billingPeriod];
  if (!months) return null;
  // Clamp month-end renewals (Jan 31 -> Feb 28), preserving UTC time.
  const day = base.getUTCDate();
  base.setUTCDate(1);
  base.setUTCMonth(base.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  base.setUTCDate(Math.min(day, lastDay));
  return base;
}

/**
 * Pure decision function (no DB, unit-testable directly — same "extract
 * the pure logic" precedent as lib/verifiedLead.js's planLeadMerge()):
 * should deactivating a subscription also clear the lead's fast-lookup
 * membershipExpiry? Only if the lead's *current* membership still points
 * at this subscription's plan — guards against clobbering a different,
 * newer active plan the lead may have moved to since.
 */
export function shouldSyncLeadOnDeactivate(lead, planId) {
  return Boolean(lead?.membership) && String(lead.membership) === String(planId);
}

async function runInTransaction(fn) {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

/**
 * Creates a pending membership request for a lead. A lead may have at most
 * one pending-or-active subscription at a time — enforced here (friendly
 * error) and again by the schema's partial unique index (DB-level
 * backstop for a concurrent double-submit).
 */
export async function createMembershipRequest({ leadId, planId }) {
  await connectDB();
  await MembershipSubscription.init();
  const plan = await Membership.findById(planId);
  if (!plan || plan.status !== 'active') {
    throw new MembershipStateError('This membership plan is not currently available.', 404);
  }

  // A calendar-expired subscription must not permanently occupy the unique
  // pending/active slot when no scheduled expiry worker is running. This
  // atomic single-collection write leaves the already-expired lead grant
  // unchanged. Release the unique slot before inserting its replacement.
  await MembershipSubscription.updateMany(
    { lead: leadId, status: 'active', expiresAt: { $lte: new Date(), $ne: null } },
    { $set: { status: 'expired' } }
  );
  const existing = await MembershipSubscription.findOne({
    lead: leadId,
    status: { $in: ['pending', 'active'] },
  });
  if (existing) {
    throw new MembershipRequestConflictError('You already have a membership request in progress.');
  }

  try {
    return await MembershipSubscription.create({
      lead: leadId,
      plan: planId,
      status: 'pending',
      paymentStatus: 'pending',
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw new MembershipRequestConflictError('You already have a membership request in progress.');
    }
    throw err;
  }
}

/**
 * Admin action — valid only from `status: 'pending'`. Syncs
 * VerifiedLead.membership/membershipExpiry in the same transaction so the
 * lead's canAccess()-visible membership never lags behind the subscription
 * record.
 */
export async function applyMembershipActivation(subscription, plan, lead, { session, expiresAt, paymentStatus = 'manual' } = {}) {
  if (!session || subscription.status !== 'pending') throw new MembershipStateError('Only a pending subscription can be activated in a transaction.');
  const now = new Date();
  const resolvedExpiresAt = expiresAt ? new Date(expiresAt) : computeExpiryFromBillingPeriod(plan.billingPeriod, now);
  if (resolvedExpiresAt && (!Number.isFinite(resolvedExpiresAt.getTime()) || resolvedExpiresAt <= now)) {
    throw new MembershipStateError('Choose a valid expiry date in the future.', 400);
  }
  subscription.status = 'active'; subscription.startsAt = now;
  subscription.expiresAt = resolvedExpiresAt; subscription.paymentStatus = paymentStatus; subscription.activatedAt = now;
  await subscription.save({ session });
  lead.membership = plan._id; lead.membershipExpiry = resolvedExpiresAt;
  await lead.save({ session });
  return subscription;
}

export async function activateMembershipSubscription(subscriptionId, { expiresAt } = {}) {
  return runInTransaction(async (session) => {
    const subscription = await MembershipSubscription.findById(subscriptionId).session(session);
    if (!subscription) throw new MembershipStateError('Membership subscription not found.', 404);
    if (subscription.status === 'active') {
      throw new MembershipStateError('This subscription is already active.');
    }
    if (subscription.status !== 'pending') {
      throw new MembershipStateError(
        `Cannot activate a subscription that is ${subscription.status} — create a new request instead.`
      );
    }

    const plan = await Membership.findById(subscription.plan).session(session);
    if (!plan) throw new MembershipStateError('The plan for this subscription no longer exists.', 404);

    const lead = await VerifiedLead.findById(subscription.lead).session(session);
    if (!lead) throw new MembershipStateError('The lead for this subscription no longer exists.', 404);
    return applyMembershipActivation(subscription, plan, lead, { session, expiresAt });
  });
}

/**
 * Admin action — valid only from `status: 'active'`. Only clears the
 * lead's fast-lookup membership fields if the lead's *current* membership
 * still points at this subscription's plan — guards against clobbering a
 * different, newer active plan the lead may have moved to since.
 */
export async function expireMembershipSubscription(subscriptionId) {
  return runInTransaction(async (session) => {
    const subscription = await MembershipSubscription.findById(subscriptionId).session(session);
    if (!subscription) throw new MembershipStateError('Membership subscription not found.', 404);
    if (subscription.status !== 'active') {
      throw new MembershipStateError('Only an active subscription can be expired.');
    }

    const now = new Date();
    subscription.status = 'expired';
    if (!subscription.expiresAt || subscription.expiresAt > now) {
      subscription.expiresAt = now;
    }
    await subscription.save({ session });

    const lead = await VerifiedLead.findById(subscription.lead).session(session);
    if (shouldSyncLeadOnDeactivate(lead, subscription.plan)) {
      lead.membershipExpiry = now;
      await lead.save({ session });
    }

    return subscription;
  });
}

/**
 * Admin action — valid from `pending` or `active` (conflict if already
 * terminal). Same lead-sync guard as expireMembershipSubscription.
 */
export async function cancelMembershipSubscription(subscriptionId) {
  return runInTransaction(async (session) => {
    const subscription = await MembershipSubscription.findById(subscriptionId).session(session);
    if (!subscription) throw new MembershipStateError('Membership subscription not found.', 404);
    if (!['pending', 'active'].includes(subscription.status)) {
      throw new MembershipStateError('This subscription is already inactive.');
    }

    const now = new Date();
    const wasActive = subscription.status === 'active';
    subscription.status = 'cancelled';
    subscription.cancelledAt = now;
    await subscription.save({ session });

    if (wasActive) {
      const lead = await VerifiedLead.findById(subscription.lead).session(session);
      if (shouldSyncLeadOnDeactivate(lead, subscription.plan)) {
        lead.membershipExpiry = now;
        await lead.save({ session });
      }
    }

    return subscription;
  });
}

/** Most recent subscription for a lead (any status) — used by GET /api/me and the dashboard. */
export async function getLatestSubscriptionForLead(leadId) {
  await connectDB();
  if (!leadId) return null;
  return MembershipSubscription.findOne({ lead: leadId }).sort({ createdAt: -1 }).populate('plan').lean();
}

/** Full subscription history for a lead, newest first. */
export async function listSubscriptionsForLead(leadId) {
  await connectDB();
  if (!leadId) return [];
  return MembershipSubscription.find({ lead: leadId }).sort({ createdAt: -1 }).populate('plan').lean();
}

const VALID_STATUSES = ['pending', 'active', 'expired', 'cancelled'];

/**
 * Admin list query — paginated (mirrors app/api/admin/blogs/route.js),
 * search across the populated lead's name/email/mobile and the plan name.
 * `effectiveStatus` is derived per row (an `active` subscription whose
 * `expiresAt` has already passed displays as `expired` without mutating
 * the stored `status`) so the admin list is always accurate without a
 * cron/scheduled job.
 */
export async function listMembershipSubscriptions({ page = 1, limit = 20, search = '', status = '' } = {}) {
  await connectDB();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const query = {};
  if (VALID_STATUSES.includes(status)) {
    query.status = status;
  }

  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    const regex = new RegExp(escapeRegex(trimmedSearch), 'i');
    const [matchingLeads, matchingPlans] = await Promise.all([
      VerifiedLead.find({ $or: [{ name: regex }, { email: regex }, { mobile: regex }] }).select('_id'),
      Membership.find({ name: regex }).select('_id'),
    ]);
    query.$or = [
      { lead: { $in: matchingLeads.map((l) => l._id) } },
      { plan: { $in: matchingPlans.map((p) => p._id) } },
    ];
  }

  const [subscriptions, total] = await Promise.all([
    MembershipSubscription.find(query)
      .populate('lead', 'name email mobile')
      .populate('plan', 'name billingPeriod price currency')
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    MembershipSubscription.countDocuments(query),
  ]);

  const now = new Date();
  const withEffectiveStatus = subscriptions.map((sub) => ({
    ...sub,
    effectiveStatus:
      sub.status === 'active' && sub.expiresAt && new Date(sub.expiresAt) <= now ? 'expired' : sub.status,
  }));

  return {
    subscriptions: withEffectiveStatus,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.max(1, Math.ceil(total / limitNum)) },
  };
}
