import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * Sprint 19.1B — the shared visitor-identity layer: "verify once, reuse
 * everywhere." A VerifiedLead is created/updated the first time a visitor
 * proves an email or mobile number via the existing OTP flow
 * (lib/verification/verificationService.js), and is later linked to a
 * User account, a Membership, and future purchases — see
 * docs/14_ACCESS_CONTROL.md and docs/13_DECISIONS.md's merge-strategy
 * entry for the full reasoning.
 *
 * `email`/`mobile` are both optional and independently sparse-unique — a
 * single lead is meant to eventually own both once evidence links them
 * (lib/verifiedLead.js's linkIdentifierToLead/mergeVerifiedLeads), but a
 * fresh lead created from a single OTP verification only has whichever one
 * identifier was just proven.
 *
 * `mergedInto` is a tombstone pointer: when two leads turn out to be the
 * same person (see lib/verifiedLead.js), the non-canonical one is not
 * deleted (so old references/tokens can still resolve) — it's marked
 * `mergedInto: <canonical lead id>` and its own `email`/`mobile` are
 * cleared so the sparse-unique indexes stay valid. Always resolve a lead id
 * through `resolveActiveLead()` before trusting it as "the" record.
 *
 * Extensibility note (Sprint 19.1B, audited before Sprint 19.2-19.5): this
 * is meant to become the platform's one permanent public identity — future
 * features like completed-course tracking, certificates, membership
 * history, notification preferences, and profile settings are not built
 * here, but none of them are blocked by this shape either. Two rules going
 * forward:
 *   1. A short, bounded, "does this lead currently have X" list (like
 *      `purchasedItems`/`bookmarks` below) is fine as a plain array field,
 *      added any time — Mongoose additive fields need no migration.
 *   2. An unbounded, ever-growing history (assessment attempts, detailed
 *      activity/notification logs, many years of membership renewals)
 *      should NOT become an array here — model it as its own collection
 *      with a `lead` foreign key instead, the same direction
 *      `models/Booking.js` already points at `Event` rather than `Event`
 *      holding an array of its bookings. `orders`/`invoices` below are a
 *      deliberate, deliberately-small exception (convenience lookup
 *      arrays); don't default new high-cardinality history fields to the
 *      same shape without re-deriving this reasoning.
 */
const VerifiedLeadSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    mobile: {
      type: String,
      trim: true,
      default: null,
    },
    preferredMethod: {
      type: String,
      enum: ['email', 'mobile', null],
      default: null,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    mobileVerifiedAt: {
      type: Date,
      default: null,
    },
    lastActivityAt: {
      type: Date,
      default: null,
    },
    linkedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    linkedUserAt: {
      type: Date,
      default: null,
    },
    // Future Membership integration (Sprint 19.x, not built yet) — kept
    // nullable so this schema ships without touching the Membership module.
    membership: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
      default: null,
    },
    membershipExpiry: {
      type: Date,
      default: null,
    },
    // `orders`/`invoices` are the authoritative transaction record —
    // refs to future Order/Invoice models that will each carry their own
    // `lead` foreign key back (see the extensibility note above). Mongoose
    // refs resolve lazily, so pointing at a model that doesn't exist yet is
    // safe; it only matters once .populate() is called.
    orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
    invoices: [{ type: Schema.Types.ObjectId, ref: 'Invoice' }],
    // `purchasedItems` and `bookmarks` are both generic "resourceType +
    // resourceId" lists spanning ANY future content type — deliberately
    // NOT one array per type (e.g. purchasedCourses/purchasedResources/
    // purchasedTools, bookmarkedCourses/bookmarkedRecipes/...). A future
    // 4th purchasable/bookmarkable type (Events, a future Program model)
    // needs zero schema change with this shape; retrofitting N type-
    // specific arrays into one polymorphic list later would be a real
    // migration, not just a schema addition — worth getting the shape
    // right now, before Sprint 19.2's Courses CMS starts writing to it.
    // `resourceType` is free text (same convention as
    // `models/Verification.js`), not validated against a registry this
    // sprint — a future purchase/bookmark feature can add that validation
    // without a schema change. `purchasedItems` is a derived fast-lookup
    // cache read by `canAccess()`'s PURCHASED check — the order/invoice
    // detail (amount, payment status, refunds) lives on `orders`/`invoices`
    // above, not here.
    purchasedItems: [
      {
        resourceType: { type: String, required: true, trim: true },
        resourceId: { type: Schema.Types.ObjectId, required: true },
        purchasedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    bookmarks: [
      {
        resourceType: { type: String, required: true, trim: true },
        resourceId: { type: Schema.Types.ObjectId, required: true },
        savedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    // Tombstone pointer — see class comment above.
    mergedInto: {
      type: Schema.Types.ObjectId,
      ref: 'VerifiedLead',
      default: null,
    },
    // Audit trail of how each identifier got attached to this lead — every
    // entry is evidence, never a guess, per docs/13_DECISIONS.md.
    identifierLinks: [
      {
        type: { type: String, enum: ['email', 'mobile'], required: true },
        value: { type: String, required: true },
        method: {
          type: String,
          enum: ['otp', 'linked_user_account', 'admin_manual'],
          required: true,
        },
        linkedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

// Sparse unique — allows unlimited docs with email/mobile both null (e.g. a
// tombstoned lead post-merge), but at most one active doc per real value.
VerifiedLeadSchema.index({ email: 1 }, { unique: true, sparse: true });
VerifiedLeadSchema.index({ mobile: 1 }, { unique: true, sparse: true });
VerifiedLeadSchema.index({ mergedInto: 1 });
VerifiedLeadSchema.index({ linkedUser: 1 }, { sparse: true });

VerifiedLeadSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    mobile: this.mobile,
    preferredMethod: this.preferredMethod,
    emailVerifiedAt: this.emailVerifiedAt,
    mobileVerifiedAt: this.mobileVerifiedAt,
    lastActivityAt: this.lastActivityAt,
    linkedUser: this.linkedUser,
    membership: this.membership,
    membershipExpiry: this.membershipExpiry,
    mergedInto: this.mergedInto,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.VerifiedLead || model('VerifiedLead', VerifiedLeadSchema);
