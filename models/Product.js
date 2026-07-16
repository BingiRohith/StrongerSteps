import mongoose from 'mongoose';
import { discountFromPrices } from '@/lib/productPricing';

const { Schema, models, model } = mongoose;

/**
 * Products collection — the public /products page's marketplace listing.
 * Mirrors the shape/conventions of models/Team.js (draft/published
 * lifecycle, single image sub-document, no slug/detail page) so the admin
 * CRUD and upload flow feel consistent with the rest of the admin panel.
 * `category` is a ref to the fully admin-managed models/ProductCategory.js
 * (Sprint 18) — previously a closed 3-value enum; see
 * docs/13_DECISIONS.md for why that changed.
 *
 * Pricing fields default to 0/'in-stock'/false rather than being required,
 * so products created before this sprint (no pricing data) keep loading and
 * saving without a migration — `discountPercentage` is always server-derived
 * from `originalPrice`/`sellingPrice` (see the pre-validate hook below), the
 * public API never trusts a client-sent discount value.
 */
const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'ProductCategory',
      required: [true, 'Category is required'],
    },
    // Sprint 12.5: optional, free text — powers the marketplace redesign's
    // "Dynamic Brands" sidebar filter (lib/publicProducts.js's
    // getProductFilterFacets() derives the actual distinct list from this
    // field, never hardcoded). Defaults to '' so existing products keep
    // loading/saving without a migration, same pattern as the pricing fields.
    brand: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    image: {
      url: { type: String, default: '' },
      alt: { type: String, trim: true, maxlength: 150, default: '' },
    },
    originalPrice: {
      type: Number,
      default: 0,
      min: [0, 'Original price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      default: 0,
      min: [0, 'Selling price cannot be negative'],
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stockStatus: {
      type: String,
      enum: ['in-stock', 'out-of-stock'],
      default: 'in-stock',
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
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

ProductSchema.index({ status: 1, category: 1, displayOrder: 1 });
ProductSchema.index({ status: 1, brand: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

// Stamp/clear publishedAt when status flips — same pattern as Team.js/Infographic.js.
ProductSchema.pre('validate', function prepareProduct(next) {
  if (this.isModified('status')) {
    if (this.status === 'published' && !this.publishedAt) {
      this.publishedAt = new Date();
    }
    if (this.status === 'draft') {
      this.publishedAt = null;
    }
  }
  next();
});

// discountPercentage is always re-derived from originalPrice/sellingPrice
// here — never trust a client-sent value — so it can't drift out of sync
// no matter which two fields the admin actually edited.
ProductSchema.pre('validate', function derivePricing(next) {
  if (this.isModified('originalPrice') || this.isModified('sellingPrice')) {
    this.discountPercentage = discountFromPrices(this.originalPrice, this.sellingPrice);
  }
  next();
});

ProductSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    name: this.name,
    description: this.description,
    category: this.category,
    brand: this.brand,
    image: this.image,
    originalPrice: this.originalPrice,
    sellingPrice: this.sellingPrice,
    discountPercentage: this.discountPercentage,
    stockStatus: this.stockStatus,
    featured: this.featured,
    displayOrder: this.displayOrder,
    status: this.status,
    publishedAt: this.publishedAt,
    author: this.author,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.Product || model('Product', ProductSchema);
