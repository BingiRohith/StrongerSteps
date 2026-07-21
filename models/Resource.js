import mongoose from 'mongoose';
import { slugify, ensureUniqueSlug } from '@/lib/slugify';
import { sharedContentFields, applyPublishLifecycle } from '@/lib/sharedContentFields';

const { Schema, models, model } = mongoose;

function trimmedLowercaseDedupedArray(arr) {
  return Array.isArray(arr)
    ? [...new Set(arr.map((s) => (typeof s === 'string' ? s.trim().toLowerCase() : '')).filter(Boolean))]
    : [];
}

/**
 * Resources collection (Sprint 19.3) — the top tier of the Resource →
 * ResourceFile hierarchy (see models/ResourceFile.js), built on
 * lib/sharedContentFields.js's reusable field pattern
 * (title/slug/description/thumbnail/status/publishedAt/featured/
 * displayOrder/accessLevel/seo/createdBy/updatedBy), same foundation
 * models/Course.js already uses — everything below is Resource-specific.
 *
 * `accessLevel` (from the shared pattern) is deliberately **informational
 * only** at this overview level — mirrors how `Course.accessLevel` behaves
 * today (only ever rendered as a badge; nothing calls canAccess() against
 * Course itself). The real per-download gate lives on each
 * `ResourceFile.accessLevel`, an independent field, not inherited from
 * here — same relationship Lesson.accessLevel/Course.accessLevel already
 * have. See docs/14_ACCESS_CONTROL.md.
 *
 * `tags` (public filter facet) and `keywords` (search-only, never shown as
 * a filter chip) are kept as two separate fields rather than collapsed
 * into one — the Sprint 19.3 brief lists them as two distinct fields in
 * both the Resource Model and Search sections, unlike Lesson's
 * "Attachments"/"Downloadable Resources" which really were the same
 * concept (docs/13_DECISIONS.md).
 *
 * `fileTypes` is server-maintained (never accepted from the client) —
 * refreshed whenever a child ResourceFile is created/updated/deleted, so
 * the public "File Type" filter facet never needs to join against
 * ResourceFile at query time.
 *
 * `deletedAt` is a Sprint 19.3-only deviation from this project's usual
 * hard-delete precedent (Course/Product/etc. all hard-delete) — see
 * docs/13_DECISIONS.md for why the Resource module specifically needed a
 * reversible delete. `DELETE` cascades to soft-deleting the resource's
 * ResourceFiles, the non-destructive version of Course's existing
 * hard-cascade-to-children rule.
 */
const ResourceSchema = new Schema(
  {
    ...sharedContentFields(),
    longDescription: {
      type: String,
      trim: true,
      default: '',
    },
    banner: {
      url: { type: String, default: '' },
      alt: { type: String, trim: true, maxlength: 150, default: '' },
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'ResourceCategory',
      required: [true, 'Category is required'],
    },
    tags: {
      type: [String],
      default: [],
      set: trimmedLowercaseDedupedArray,
    },
    keywords: {
      type: [String],
      default: [],
      set: trimmedLowercaseDedupedArray,
    },
    // Free text — the brief asks for a single "Author" field, unlike
    // Course's explicit "Multiple Instructors" ask, so no embedded person
    // sub-document here (docs/13_DECISIONS.md).
    author: {
      type: String,
      trim: true,
      maxlength: 150,
      default: '',
    },
    estimatedReadingTime: {
      type: Number,
      default: 0,
      min: [0, 'Estimated reading time cannot be negative'],
    },
    language: {
      type: String,
      trim: true,
      maxlength: 60,
      default: 'English',
    },
    fileTypes: {
      type: [String],
      default: [],
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

ResourceSchema.index({ status: 1, category: 1, displayOrder: 1 });
ResourceSchema.index({ status: 1, featured: 1 });
ResourceSchema.index({ status: 1, publishedAt: -1 });
ResourceSchema.index({ deletedAt: 1 });
ResourceSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  keywords: 'text',
  author: 'text',
});

// Auto-generate a unique slug from the title, and apply the shared
// draft/published lifecycle stamp — same combined pattern as
// models/Course.js.
ResourceSchema.pre('validate', async function prepareResource(next) {
  try {
    const wantsRegeneration = this.isModified('slug') || !this.slug || this.isModified('title');

    if (wantsRegeneration) {
      const source = this.isModified('slug') && this.slug ? this.slug : this.title;
      const base = slugify(source);
      this.slug = await ensureUniqueSlug(base, async (candidate) => {
        const existing = await this.constructor
          .findOne({ slug: candidate, _id: { $ne: this._id } })
          .lean();
        return Boolean(existing);
      });
    }

    next();
  } catch (err) {
    next(err);
  }
});

applyPublishLifecycle(ResourceSchema);

ResourceSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    title: this.title,
    slug: this.slug,
    description: this.description,
    longDescription: this.longDescription,
    thumbnail: this.thumbnail,
    banner: this.banner,
    category: this.category,
    tags: this.tags,
    keywords: this.keywords,
    author: this.author,
    estimatedReadingTime: this.estimatedReadingTime,
    language: this.language,
    fileTypes: this.fileTypes,
    featured: this.featured,
    displayOrder: this.displayOrder,
    accessLevel: this.accessLevel,
    status: this.status,
    publishedAt: this.publishedAt,
    seo: this.seo,
    deletedAt: this.deletedAt,
    createdBy: this.createdBy,
    updatedBy: this.updatedBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.Resource || model('Resource', ResourceSchema);
