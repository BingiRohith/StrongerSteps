import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * Backs the reusable OTP verification service (lib/verification/*), not
 * just Knowledge Center downloads — `resourceType` is deliberately free text
 * rather than a Mongoose enum, validated instead against the code-level
 * registry in lib/verification/resourceRegistry.js, so future resource
 * types (Membership downloads, Certificates, Recipes, Programs, ...) can
 * register there without a schema migration.
 *
 * OTP is never stored in plain text — only `otpHash` (bcrypt, same
 * dependency already used for User passwords).
 */
const VerificationSchema = new Schema(
  {
    resourceType: {
      type: String,
      required: [true, 'Resource type is required'],
      trim: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Resource id is required'],
    },
    method: {
      type: String,
      enum: ['email', 'mobile'],
      required: [true, 'Verification method is required'],
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
    otpHash: {
      type: String,
      required: true,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    downloadedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Rate-limit lookups: "how many OTP requests has this email/mobile made recently".
VerificationSchema.index({ email: 1, createdAt: 1 });
VerificationSchema.index({ mobile: 1, createdAt: 1 });
// Auto-purge stale rows (verified or not) a day after creation — dependency-free hygiene.
VerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

VerificationSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    resourceType: this.resourceType,
    resourceId: this.resourceId,
    method: this.method,
    verified: this.verified,
    expiresAt: this.expiresAt,
    verifiedAt: this.verifiedAt,
    downloadedAt: this.downloadedAt,
    createdAt: this.createdAt,
  };
};

export default models.Verification || model('Verification', VerificationSchema);
