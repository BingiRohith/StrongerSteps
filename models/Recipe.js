import mongoose from 'mongoose';
import { slugify, ensureUniqueSlug } from '@/lib/slugify';
import { DIFFICULTY_VALUES } from '@/lib/recipeOptions';

const { Schema, models, model } = mongoose;

// Trimmed, filtered string-array setter shared by ingredients/instructions —
// same "array order = display order" convention as Membership.benefits, so
// the admin's add/edit/delete/reorder controls (see BenefitsEditor.js) can
// be reused as-is for both dynamic lists.
function trimmedStringArray(arr) {
  return Array.isArray(arr) ? arr.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean) : [];
}

/**
 * Recipes collection (Sprint 13) — replaces the placeholder /recipes page.
 * Mirrors the shape/conventions of Product/Team/Membership (draft/published
 * lifecycle, displayOrder-driven sort, sub-document images) but adds a
 * Blog-style slug (SEO-friendly detail URLs per the CRS) and several
 * dynamic, unlimited sub-lists (ingredients, instructions, nutrition,
 * gallery) instead of hardcoded fields — see docs/13_DECISIONS.md for why
 * these are plain arrays rather than a richer structured schema.
 */
const RecipeSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Recipe name is required'],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    fullDescription: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: '',
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'RecipeCategory',
      required: [true, 'Category is required'],
    },
    tags: {
      type: [String],
      default: [],
      set: (tags) =>
        Array.isArray(tags)
          ? [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))]
          : [],
    },
    difficulty: {
      type: String,
      enum: DIFFICULTY_VALUES,
      default: 'Easy',
    },
    prepTime: {
      type: Number,
      default: 0,
      min: [0, 'Preparation time cannot be negative'],
    },
    cookTime: {
      type: Number,
      default: 0,
      min: [0, 'Cooking time cannot be negative'],
    },
    servings: {
      type: Number,
      default: 1,
      min: [1, 'Servings must be at least 1'],
    },
    ingredients: {
      type: [String],
      default: [],
      set: trimmedStringArray,
    },
    instructions: {
      type: [String],
      default: [],
      set: trimmedStringArray,
    },
    // Dynamic nutrition rows (label/value pairs, e.g. "Calories" / "180 kcal")
    // — never a fixed set of fields, per the CRS ("do NOT hardcode nutrition
    // fields"). Array order is display order, same convention as ingredients.
    nutrition: {
      type: [
        {
          label: { type: String, trim: true, maxlength: 60 },
          value: { type: String, trim: true, maxlength: 60 },
          _id: false,
        },
      ],
      default: [],
    },
    featuredImage: {
      url: { type: String, default: '' },
      alt: { type: String, trim: true, maxlength: 150, default: '' },
    },
    gallery: {
      type: [
        {
          url: { type: String, default: '' },
          alt: { type: String, trim: true, maxlength: 150, default: '' },
          _id: false,
        },
      ],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    seo: {
      title: { type: String, trim: true, maxlength: 70, default: '' },
      metaDescription: { type: String, trim: true, maxlength: 160, default: '' },
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

RecipeSchema.index({ status: 1, displayOrder: 1 });
RecipeSchema.index({ status: 1, category: 1 });
RecipeSchema.index({ status: 1, featured: 1 });
RecipeSchema.index({ name: 'text', shortDescription: 'text', tags: 'text' });

// Auto-generate a unique slug from the name (SEO-friendly detail URLs,
// e.g. /recipes/high-protein-paneer-salad) and stamp/clear publishedAt when
// status flips — same combined pattern as models/Blog.js + models/Product.js.
RecipeSchema.pre('validate', async function prepareRecipe(next) {
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

    if (this.isModified('status')) {
      if (this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
      }
      if (this.status === 'draft') {
        this.publishedAt = null;
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

RecipeSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    name: this.name,
    slug: this.slug,
    shortDescription: this.shortDescription,
    fullDescription: this.fullDescription,
    category: this.category,
    tags: this.tags,
    difficulty: this.difficulty,
    prepTime: this.prepTime,
    cookTime: this.cookTime,
    servings: this.servings,
    ingredients: this.ingredients,
    instructions: this.instructions,
    nutrition: this.nutrition,
    featuredImage: this.featuredImage,
    gallery: this.gallery,
    featured: this.featured,
    displayOrder: this.displayOrder,
    status: this.status,
    publishedAt: this.publishedAt,
    seo: this.seo,
    author: this.author,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.Recipe || model('Recipe', RecipeSchema);
