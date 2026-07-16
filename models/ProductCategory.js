import mongoose from 'mongoose';
import { slugify, ensureUniqueSlug } from '@/lib/slugify';

const { Schema, models, model } = mongoose;

/**
 * Product Categories collection — Sprint 18. Replaces the closed
 * `Product.category` enum (`lib/productCategories.js`, removed) with a
 * fully admin-managed taxonomy, same shape/CRUD pattern as
 * `models/RecipeCategory.js` (Create/Edit/Delete/Reorder/Activate), per
 * docs/13_DECISIONS.md's "future content type needing managed categories
 * should get its own <Module>Category model" precedent. `icon` is optional
 * and future-ready (falls back to a generic icon on the public grid when
 * unset) — same sub-document shape as Product.image.
 */
const ProductCategorySchema = new Schema(
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

ProductCategorySchema.index({ isActive: 1, displayOrder: 1 });

// Auto-generate a unique slug from the name (only when the name changes and
// the slug wasn't explicitly hand-edited to something else) — same pattern
// as models/RecipeCategory.js/models/Blog.js.
ProductCategorySchema.pre('validate', async function prepareProductCategory(next) {
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

ProductCategorySchema.methods.toSafeObject = function toSafeObject() {
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

export default models.ProductCategory || model('ProductCategory', ProductCategorySchema);
