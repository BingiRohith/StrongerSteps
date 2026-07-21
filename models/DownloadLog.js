import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * Sprint 19.3 — a generic, reusable download-tracking log, not
 * Resource-specific. `resourceType`/`resourceId`/`fileKind` follow the
 * same polymorphic, free-text convention already established by
 * models/Verification.js's `resourceType` and models/VerifiedLead.js's
 * `purchasedItems`/`bookmarks` — validated against
 * lib/verification/resourceRegistry.js's keys at the application layer,
 * not a DB enum, so a future resource type needs zero schema migration
 * here.
 *
 * Written best-effort (wrapped in try/catch by every caller — see
 * lib/downloadLog.js) from the two places that actually hand out file
 * bytes: app/api/verify/download/route.js (covers every OTP-gated
 * resourceType — infographic/lesson/resource — uniformly, not just
 * Resources) and app/api/resource-files/[fileId]/route.js's
 * `action=download` branch. A logging failure must never break the
 * download response.
 *
 * This is the "prepare the architecture, don't build analytics"
 * instruction from the Sprint 19.3 brief — no admin route reads this
 * collection yet. Per docs/14_ACCESS_CONTROL.md's rule that an unbounded,
 * ever-growing history belongs in its own collection with a `lead`
 * foreign key rather than an array on VerifiedLead, same relational
 * direction Booking already uses toward Event.
 */
const DownloadLogSchema = new Schema(
  {
    resourceType: {
      type: String,
      required: [true, 'resourceType is required'],
      trim: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      required: [true, 'resourceId is required'],
    },
    // Mirrors the existing `fileKind` query param already used by
    // /api/verify/download and /api/lessons/[id]/media — a ResourceFile
    // id string for Resources, 'image'|'pdf' for Infographics, etc.
    fileKind: {
      type: String,
      default: '',
    },
    fileLabel: {
      type: String,
      trim: true,
      default: '',
    },
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'VerifiedLead',
      default: null,
    },
    downloadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

DownloadLogSchema.index({ resourceType: 1, resourceId: 1, downloadedAt: -1 });
DownloadLogSchema.index({ lead: 1, downloadedAt: -1 });

export default models.DownloadLog || model('DownloadLog', DownloadLogSchema);
