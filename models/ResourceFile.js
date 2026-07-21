import mongoose from 'mongoose';
import { ACCESS_LEVELS, ACCESS_LEVEL_VALUES } from '@/lib/access/accessLevels';
import { FILE_TYPE_VALUES } from '@/lib/resourceOptions';

const { Schema, models, model } = mongoose;

/**
 * Resource Files collection (Sprint 19.3) — the leaf tier of the Resource
 * → ResourceFile hierarchy. A separate top-level collection with a
 * `resource` FK ref, not an embedded array — same "hierarchy = separate
 * collection + FK" pattern this project already established for
 * Section/Lesson (models/Section.js, models/Lesson.js), and for the same
 * reason: each file needs its own stable top-level id for the
 * verification registry (lib/verification/resourceRegistry.js),
 * download-token scoping, and models/DownloadLog.js.
 *
 * `accessLevel` is its own field, default PUBLIC, **not inherited** from
 * the parent Resource — mirrors Lesson.accessLevel/Course.accessLevel's
 * exact relationship (a Resource can be freely browsable while a specific
 * file inside it is gated). `previewAvailable` mirrors
 * Lesson.previewAvailable exactly: bypasses this file's own accessLevel
 * gate entirely (a "free preview"), handled by the route/page that serves
 * a file, not by canAccess() itself.
 *
 * `file` is always written to private storage
 * (private-uploads/resources-files/ via lib/privateUpload.js)
 * **regardless of accessLevel** — same Sprint 12.5 reasoning Lesson media
 * already relies on (an accessLevel can change after upload; a stale
 * public path would silently bypass a later re-gate). `Resource.thumbnail`
 * /`banner` (marketing images, not this model) are the only Resource-module
 * assets that use the public upload service — see docs/13_DECISIONS.md.
 *
 * `file` is a nested sub-object — `{url, filename, mimeType, sizeBytes,
 * storageProvider}` — rather than flattened fields, deliberately: this is
 * the exact shape a future `ResourceFileVersion` row would carry (`file`
 * FK -> this collection, `version` Number, the same
 * {url,filename,mimeType,sizeBytes,storageProvider} shape, `uploadedAt`,
 * `uploadedBy`, `changeNote`), so promoting version history into its own
 * collection later (per docs/14_ACCESS_CONTROL.md's rule that an
 * unbounded history belongs in its own collection with an FK, not an
 * array/flattened fields) is a mechanical lift, not a redesign. No such
 * collection is built this sprint — the brief's own "DO NOT BUILD" list
 * excludes a Version History UI. `currentVersion` is a zero-cost counter
 * bumped whenever an admin re-uploads a replacement file for an existing
 * record; no history of the replaced file is kept yet.
 *
 * `deletedAt` mirrors models/Resource.js's soft-delete — see that file's
 * header comment and docs/13_DECISIONS.md.
 */
const ResourceFileSchema = new Schema(
  {
    resource: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: [true, 'Resource is required'],
    },
    title: {
      type: String,
      required: [true, 'File title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    fileType: {
      type: String,
      enum: FILE_TYPE_VALUES,
      required: [true, 'File type is required'],
    },
    // Scoped to siblings within the same resource.
    displayOrder: {
      type: Number,
      default: 0,
    },
    previewAvailable: {
      type: Boolean,
      default: false,
    },
    downloadable: {
      type: Boolean,
      default: true,
    },
    accessLevel: {
      type: String,
      enum: ACCESS_LEVEL_VALUES,
      default: ACCESS_LEVELS.PUBLIC,
    },
    file: {
      url: { type: String, default: '' }, // private storage key, resolved via the gated files route
      filename: { type: String, default: '' },
      mimeType: { type: String, default: '' },
      sizeBytes: { type: Number, default: 0 },
      storageProvider: { type: String, default: 'local' },
    },
    // For fileType 'external_link' only.
    externalUrl: {
      type: String,
      trim: true,
      default: '',
    },
    currentVersion: {
      type: Number,
      default: 1,
      min: 1,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

ResourceFileSchema.index({ resource: 1, displayOrder: 1 });
ResourceFileSchema.index({ deletedAt: 1 });

ResourceFileSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    resource: this.resource,
    title: this.title,
    description: this.description,
    fileType: this.fileType,
    displayOrder: this.displayOrder,
    previewAvailable: this.previewAvailable,
    downloadable: this.downloadable,
    accessLevel: this.accessLevel,
    file: this.file,
    externalUrl: this.externalUrl,
    currentVersion: this.currentVersion,
    deletedAt: this.deletedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.ResourceFile || model('ResourceFile', ResourceFileSchema);
