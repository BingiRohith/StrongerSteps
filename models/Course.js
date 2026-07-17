import mongoose from 'mongoose';
import { slugify, ensureUniqueSlug } from '@/lib/slugify';
import { sharedContentFields, applyPublishLifecycle } from '@/lib/sharedContentFields';
import { DIFFICULTY_VALUES } from '@/lib/courseOptions';

const { Schema, models, model } = mongoose;

// Trimmed, filtered string-array setter — same convention as
// Membership.benefits/Recipe.ingredients/Recipe.instructions, reused here
// for Prerequisites/Learning Outcomes/What You'll Learn.
function trimmedStringArray(arr) {
  return Array.isArray(arr) ? arr.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean) : [];
}

/**
 * Courses collection (Sprint 19.2) — the first model built on
 * lib/sharedContentFields.js's reusable field pattern (title/slug/
 * description/thumbnail/status/publishedAt/featured/displayOrder/
 * accessLevel/seo/createdBy/updatedBy), rather than hand-writing that shape
 * again. `description` (from the shared pattern) doubles as the brief's
 * "Short Description"; `longDescription` below is the separate rich-text
 * field, mirroring Blog.content's HTML-string convention.
 *
 * `accessLevel` (from the shared pattern, lib/access/accessLevels.js) gates
 * the *course* as a whole — individual Lessons carry their own
 * `accessLevel` too (models/Lesson.js), since a course can be freely
 * browsable while its lesson content is gated. See docs/14_ACCESS_CONTROL.md
 * for how canAccess() resolves both together, and
 * docs/13_DECISIONS.md for why PURCHASED-level checks always resolve
 * against the *course* id, even when triggered from a lesson-level check.
 *
 * `instructors` is an array of self-contained embedded sub-documents, not
 * a ref to `models/Team.js` — same precedent as `models/Event.js`'s
 * `hostName`/`hostImage` (a person shown on public content is not forced
 * into the Team taxonomy just because they could conceptually be a team
 * member). Kept embedded rather than extracted into its own `Instructor`
 * collection — at true LMS scale (recurring named instructors teaching
 * many courses, instructor profile pages) a referenced model would avoid
 * duplicating/re-editing the same bio across courses, but that's a bigger,
 * currently-unrequested feature (dedicated Instructor CRUD + profile
 * pages); building it speculatively now would be scope beyond what's
 * asked for. Plural **array**, not a single embedded object, specifically
 * because that shape change (unlike adding a new field) would need a real
 * data migration once real courses exist — see docs/13_DECISIONS.md.
 */
const CourseSchema = new Schema(
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
    instructors: {
      type: [
        {
          name: { type: String, trim: true, maxlength: 100, default: '' },
          title: { type: String, trim: true, maxlength: 150, default: '' },
          bio: { type: String, trim: true, maxlength: 1000, default: '' },
          photo: {
            url: { type: String, default: '' },
            alt: { type: String, trim: true, maxlength: 150, default: '' },
          },
        },
      ],
      default: [],
    },
    // Free text rather than a fixed numeric field — total course duration
    // isn't always additive ("self-paced", "6 weeks", "12 hours total").
    // Lesson.estimatedDuration (per-lesson, numeric minutes) is the
    // structured counterpart this can eventually be computed from.
    duration: {
      type: String,
      trim: true,
      maxlength: 60,
      default: '',
    },
    difficulty: {
      type: String,
      enum: DIFFICULTY_VALUES,
      default: 'Beginner',
    },
    language: {
      type: String,
      trim: true,
      maxlength: 60,
      default: 'English',
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'CourseCategory',
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
    prerequisites: {
      type: [String],
      default: [],
      set: trimmedStringArray,
    },
    learningOutcomes: {
      type: [String],
      default: [],
      set: trimmedStringArray,
    },
    whatYoullLearn: {
      type: [String],
      default: [],
      set: trimmedStringArray,
    },
    // Sprint 19.2 is foundation only — this is metadata the admin can set,
    // not wired to an actual certificate-issuing flow yet (that's a future
    // sprint; see docs/14_ACCESS_CONTROL.md's "Future extensibility" note
    // on `VerifiedLead.certificates`).
    certificateAvailable: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

CourseSchema.index({ status: 1, category: 1, displayOrder: 1 });
CourseSchema.index({ status: 1, featured: 1 });
// Sprint 19.2 scalability review — both back query patterns GET
// /api/courses already ships (difficulty filter, 'newest' sort), added now
// while the collection is still small (cheap either way at this size, but
// zero reason to defer since the query patterns already exist). No index
// added for `language` yet — nothing queries by it today; add one the
// moment a language filter is actually wired into the public API, not
// preemptively. See docs/13_DECISIONS.md.
CourseSchema.index({ status: 1, difficulty: 1 });
CourseSchema.index({ status: 1, publishedAt: -1 });
CourseSchema.index({ title: 'text', description: 'text', tags: 'text', 'instructors.name': 'text' });

// Auto-generate a unique slug from the title, and apply the shared
// draft/published lifecycle stamp — same combined pattern as
// models/Recipe.js/models/Blog.js, using lib/sharedContentFields.js's
// applyPublishLifecycle() for the second half instead of re-copying it.
CourseSchema.pre('validate', async function prepareCourse(next) {
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

applyPublishLifecycle(CourseSchema);

CourseSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    title: this.title,
    slug: this.slug,
    description: this.description,
    longDescription: this.longDescription,
    thumbnail: this.thumbnail,
    banner: this.banner,
    instructors: this.instructors,
    duration: this.duration,
    difficulty: this.difficulty,
    language: this.language,
    category: this.category,
    tags: this.tags,
    prerequisites: this.prerequisites,
    learningOutcomes: this.learningOutcomes,
    whatYoullLearn: this.whatYoullLearn,
    certificateAvailable: this.certificateAvailable,
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

export default models.Course || model('Course', CourseSchema);
