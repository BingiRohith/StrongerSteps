import mongoose from 'mongoose';
import { CURRENCY_VALUES, BILLING_PERIOD_VALUES, PLAN_THEME_VALUES } from '@/lib/membershipOptions';

const { Schema, models, model } = mongoose;

/**
 * Membership collection — the public /join page's plan cards. Replaces the
 * Sprint 10 hardcoded `MEMBERSHIP_PLANS` array. Mirrors the shape/conventions
 * of models/Product.js and models/Team.js (single sub-document image,
 * displayOrder-driven sort) but uses an `active`/`inactive` status pair
 * instead of `draft`/`published`, per Sprint 11's explicit spec ("Status
 * (Active / Inactive)") rather than the draft/publish lifecycle the other
 * modules use.
 */
const MembershipSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      maxlength: 100,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: 200,
    },
    longDescription: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      enum: CURRENCY_VALUES,
      default: 'INR',
    },
    billingPeriod: {
      type: String,
      enum: BILLING_PERIOD_VALUES,
      default: 'monthly',
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    badgeLabel: {
      type: String,
      trim: true,
      maxlength: 40,
      default: '',
    },
    theme: {
      type: String,
      enum: PLAN_THEME_VALUES,
      default: 'sage',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    ctaLabel: {
      type: String,
      trim: true,
      maxlength: 40,
      default: 'Join Now',
    },
    ctaUrl: {
      type: String,
      trim: true,
      default: '',
    },
    externalUrl: {
      type: String,
      trim: true,
      default: '',
    },
    benefits: {
      type: [String],
      default: [],
      set: (benefits) =>
        Array.isArray(benefits) ? benefits.map((b) => b.trim()).filter(Boolean) : [],
    },
    image: {
      url: { type: String, default: '' },
      alt: { type: String, trim: true, maxlength: 150, default: '' },
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

MembershipSchema.index({ status: 1, displayOrder: 1 });
MembershipSchema.index({ name: 'text', shortDescription: 'text', longDescription: 'text' });

MembershipSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    name: this.name,
    shortDescription: this.shortDescription,
    longDescription: this.longDescription,
    price: this.price,
    currency: this.currency,
    billingPeriod: this.billingPeriod,
    discountPercentage: this.discountPercentage,
    status: this.status,
    featured: this.featured,
    badgeLabel: this.badgeLabel,
    theme: this.theme,
    displayOrder: this.displayOrder,
    ctaLabel: this.ctaLabel,
    ctaUrl: this.ctaUrl,
    externalUrl: this.externalUrl,
    benefits: this.benefits,
    image: this.image,
    author: this.author,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.Membership || model('Membership', MembershipSchema);
