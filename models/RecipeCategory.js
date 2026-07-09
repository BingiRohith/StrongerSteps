import mongoose from 'mongoose';
import { slugify, ensureUniqueSlug } from '@/lib/slugify';

const { Schema, models, model } = mongoose;

/**
 * Recipe Categories collection — a dedicated, full-featured taxonomy for
 * Recipes (Sprint 13), unlike the free-text Infographic.category or the
 * closed-enum Product.category. The CRS explicitly calls for admin-managed
 * Create/Edit/Delete/Activate-Deactivate/Reorder here, so it needs its own
 * model rather than reusing the minimal models/Category.js (which only
 * backs the Blog category picker — see docs/13_DECISIONS.md).
 */
const RecipeCategorySchema = new Schema(
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
    featuredImage: {
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

RecipeCategorySchema.index({ isActive: 1, displayOrder: 1 });

// Auto-generate a unique slug from the name (only when the name changes and
// the slug wasn't explicitly hand-edited to something else) — same pattern
// as models/Blog.js.
RecipeCategorySchema.pre('validate', async function prepareRecipeCategory(next) {
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

RecipeCategorySchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    name: this.name,
    slug: this.slug,
    description: this.description,
    featuredImage: this.featuredImage,
    displayOrder: this.displayOrder,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.RecipeCategory || model('RecipeCategory', RecipeCategorySchema);
