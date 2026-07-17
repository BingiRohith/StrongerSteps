import mongoose from 'mongoose';
import { ACCESS_LEVELS, ACCESS_LEVEL_VALUES } from '@/lib/access/accessLevels';

const { Schema } = mongoose;

export const CONTENT_STATUS_VALUES = ['draft', 'published'];

/**
 * Sprint 19.1B (revised) — a generic, reusable **field pattern**, not a
 * base class and not a plugin system. Any content module — new (Course,
 * Resource, Tool) or existing (Blog, Infographic, Recipe, Product, Team,
 * a future Program model, ...) — can spread `sharedContentFields()` into
 * its own `new Schema({...})` call and/or call `applyPublishLifecycle()`
 * for the shared draft/published-stamping hook, exactly like copying a
 * convention, never through inheritance. A module can adopt the whole
 * set, cherry-pick individual keys (e.g. just `accessLevel` without the
 * rest), or ignore this file entirely and keep its own shape — nothing
 * requires it, and nothing here reaches into another schema to change it.
 *
 * Existing models are **not** refactored onto this — see
 * docs/13_DECISIONS.md. This file exists so *future* schema decisions
 * (a new module, or a future rewrite of an old one) have one obvious,
 * consistent shape to reach for instead of each module re-deriving its
 * own title/slug/status/seo/etc. fields independently, the way
 * Blog/Infographic/Product/Team/Recipe currently each do slightly
 * differently (see docs/08_CODING_STANDARDS.md's "Content model pattern").
 *
 * Usage in a future model (illustrative — no such model exists yet):
 *   const CourseSchema = new Schema({
 *     ...sharedContentFields(),
 *     category: { type: Schema.Types.ObjectId, ref: 'CourseCategory', required: true },
 *     // ...module-specific fields
 *   }, { timestamps: true });
 *   applyPublishLifecycle(CourseSchema);
 *
 * `createdBy`/`updatedBy` (a pair) is a deliberate change from the existing
 * single `author` field every pre-Sprint-19 model uses — see
 * docs/13_DECISIONS.md for why, and don't retrofit it onto existing models
 * without a separate, explicit decision.
 */
export function sharedContentFields() {
  return {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    thumbnail: {
      url: { type: String, default: '' },
      alt: { type: String, trim: true, maxlength: 150, default: '' },
    },
    status: {
      type: String,
      enum: CONTENT_STATUS_VALUES,
      default: 'draft',
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    accessLevel: {
      type: String,
      enum: ACCESS_LEVEL_VALUES,
      default: ACCESS_LEVELS.PUBLIC,
    },
    seo: {
      title: { type: String, trim: true, maxlength: 70, default: '' },
      metaDescription: { type: String, trim: true, maxlength: 160, default: '' },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  };
}

/**
 * Shared publish-lifecycle hook — same stamp/clear-publishedAt-on-status-
 * change behavior every existing model (Blog/Product/Team/...) already
 * duplicates in its own pre('validate') hook. A module built on
 * sharedContentFields() can call this instead of re-copying the hook body;
 * a module that isn't can just as easily keep writing its own — this is a
 * convenience, not a requirement.
 */
export function applyPublishLifecycle(schema) {
  schema.pre('validate', function stampPublishedAt(next) {
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
}
