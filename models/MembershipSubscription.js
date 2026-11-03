import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * Sprint 19.7a — the per-lead membership subscription instance: "who
 * requested/holds which plan, and its lifecycle." Kept as its own
 * top-level collection with a `lead` foreign key (not an array on
 * `VerifiedLead`) per docs/14_ACCESS_CONTROL.md's rule for unbounded,
 * ever-growing per-lead history — the doc's own future-extensibility table
 * predicted this exact model by this exact name ("Membership history...
 * belongs in its own MembershipSubscription collection with a lead foreign
 * key").
 *
 * Deliberately separate from `models/Membership.js`, which stays the plan
 * *catalog* ("what plans exist," feeds the public /join page) — this model
 * is "who has requested/holds which plan, and its lifecycle." Confirmed
 * Sprint 19.7 (docs/13_DECISIONS.md): subscription state's fast-lookup half
 * (`VerifiedLead.membership`/`membershipExpiry`, read by `canAccess()`)
 * stays on `VerifiedLead` unchanged — this collection is the audit trail/
 * admin-manageable layer on top, kept in sync by explicit functions in
 * `lib/membershipSubscription.js`, never a background job.
 *
 * `status` is the generic subscription lifecycle; `paymentStatus` is a
 * deliberately separate, independent field (per Sprint 19.7a design review)
 * so Sprint 19.7b's Razorpay integration can widen/extend payment handling
 * (webhook-driven `paid`/`failed`/`refunded` states) without touching the
 * lifecycle enum or any code that branches on `status`.
 */
const MembershipSubscriptionSchema = new Schema(
  {
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'VerifiedLead',
      required: [true, 'Lead is required'],
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
      required: [true, 'Plan is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'cancelled'],
      default: 'pending',
    },
    // No gateway yet (Sprint 19.7b) — 'manual' means an admin confirmed
    // payment was collected outside the platform. Widening this enum for
    // Razorpay later (e.g. 'paid', 'failed', 'refunded') is a zero-cost
    // additive change, same as any other Mongoose enum widening.
    paymentStatus: {
      type: String,
      enum: ['pending', 'manual'],
      default: 'pending',
    },
    startsAt: {
      type: Date,
      default: null,
    },
    // null = never expires (one-time/free plans) — mirrors
    // VerifiedLead.membershipExpiry's own "no expiry set = not yet
    // time-boxed" convention read by canAccess().
    expiresAt: {
      type: Date,
      default: null,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

MembershipSubscriptionSchema.index({ lead: 1, status: 1 });
MembershipSubscriptionSchema.index({ status: 1, expiresAt: 1 });
// Race-safe "at most one pending-or-active subscription per lead" —
// DB-enforced, not just an application-level pre-check, mirroring
// VerifiedLead's existing sparse-unique convention for email/mobile. Two
// concurrent duplicate requests can't both succeed even under a race; the
// loser surfaces as an 11000 duplicate-key error, caught and turned into a
// friendly conflict by lib/membershipSubscription.js's createMembershipRequest().
MembershipSubscriptionSchema.index(
  { lead: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'active'] } } }
);

MembershipSubscriptionSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    lead: this.lead,
    plan: this.plan,
    status: this.status,
    paymentStatus: this.paymentStatus,
    startsAt: this.startsAt,
    expiresAt: this.expiresAt,
    activatedAt: this.activatedAt,
    cancelledAt: this.cancelledAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.MembershipSubscription || model('MembershipSubscription', MembershipSubscriptionSchema);
