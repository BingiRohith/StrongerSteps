import mongoose from 'mongoose';
import { slugify, ensureUniqueSlug } from '@/lib/slugify';

const { Schema, models, model } = mongoose;

/**
 * Resource Categories collection (Sprint 19.3) — a dedicated, full-featured
 * taxonomy for the Digital Resource Library, mirroring
 * models/CourseCategory.js/models/ProductCategory.js/models/RecipeCategory.js
 * exactly (same Create/Edit/Delete/Activate-Deactivate/Reorder admin
 * pattern) per this project's established "future content type needing
 * managed categories should get its own <Module>Category model" precedent
 * — see docs/13_DECISIONS.md.
 */
const ResourceCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    icon: {
      url: { type: String, default: '' },
      alt: { type: String, trim: true, maxlength: 150, default: '' },
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

ResourceCategorySchema.index({ isActive: 1, displayOrder: 1 });

// Auto-generate a unique slug from the name — same pattern as
// models/CourseCategory.js/models/RecipeCategory.js/models/Blog.js.
ResourceCategorySchema.pre('validate', async function prepareResourceCategory(next) {
  try {
    const wantsRegeneration = this.isModified('slug') || !this.slug || this.isModified('name');

    if (wantsRegeneration) {
      const source = this.isModified('slug') && this.slug ? this.slug : this.name;
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

ResourceCategorySchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    name: this.name,
    slug: this.slug,
    description: this.description,
    icon: this.icon,
    displayOrder: this.displayOrder,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.ResourceCategory || model('ResourceCategory', ResourceCategorySchema);
