import mongoose from 'mongoose';
import { slugify, ensureUniqueSlug } from '@/lib/slugify';
import { sharedContentFields, applyPublishLifecycle } from '@/lib/sharedContentFields';
import { TOOL_TYPE_VALUES } from '@/lib/toolOptions';

const { Schema, models, model } = mongoose;

function trimmedLowercaseDedupedArray(arr) {
  return Array.isArray(arr)
    ? [...new Set(arr.map((s) => (typeof s === 'string' ? s.trim().toLowerCase() : '')).filter(Boolean))]
    : [];
}

/**
 * Tools collection (Sprint 19.4) — the top tier of the Tool → ToolSection →
 * ToolQuestion hierarchy (see models/ToolSection.js/models/ToolQuestion.js),
 * built on lib/sharedContentFields.js's reusable field pattern, same
 * foundation models/Course.js/models/Resource.js already use.
 *
 * `accessLevel` (from the shared pattern) gates whether *submitting* the
 * assessment for a result requires OTP verification — the blank
 * sections/questions are always publicly viewable, same "gate the valuable
 * part, not the metadata" relationship Resource/ResourceFile has. See
 * lib/verification/resourceRegistry.js's `tool` entry and
 * app/api/tools/[slug]/attempt/route.js.
 *
 * First tool built on this model is the Fall Risk Assessment Calculator
 * (`toolType: 'assessment'`) — `toolType` is a closed, extensible set (see
 * lib/toolOptions.js) so a future simple single-value calculator
 * (`toolType: 'calculator'`) doesn't need a schema change, just a new row.
 *
 * `disclaimer` and `estimatedMinutes` are tool-level metadata shown on the
 * public detail page above the assessment form — no scoring logic lives in
 * this model itself; that's entirely data-driven from ToolQuestion/
 * ToolResultBand (see lib/toolScoring.js).
 */
const ToolSchema = new Schema(
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
      ref: 'ToolCategory',
      required: [true, 'Category is required'],
    },
    tags: {
      type: [String],
      default: [],
      set: trimmedLowercaseDedupedArray,
    },
    toolType: {
      type: String,
      enum: TOOL_TYPE_VALUES,
      default: 'assessment',
    },
    disclaimer: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    estimatedMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Estimated minutes cannot be negative'],
    },
  },
  { timestamps: true }
);

ToolSchema.index({ status: 1, category: 1, displayOrder: 1 });
ToolSchema.index({ status: 1, featured: 1 });
ToolSchema.index({ status: 1, publishedAt: -1 });
ToolSchema.index({ title: 'text', description: 'text', tags: 'text' });

ToolSchema.pre('validate', async function prepareTool(next) {
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

applyPublishLifecycle(ToolSchema);

ToolSchema.methods.toSafeObject = function toSafeObject() {
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
    toolType: this.toolType,
    disclaimer: this.disclaimer,
    estimatedMinutes: this.estimatedMinutes,
    featured: this.featured,
    displayOrder: this.displayOrder,
    accessLevel: this.accessLevel,
    status: this.status,
    publishedAt: this.publishedAt,
    seo: this.seo,
    createdBy: this.createdBy,
    updatedBy: this.updatedBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.Tool || model('Tool', ToolSchema);
