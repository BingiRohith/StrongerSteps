import mongoose from 'mongoose';
import { ACCESS_LEVELS, ACCESS_LEVEL_VALUES } from '@/lib/access/accessLevels';
import { LESSON_TYPE_VALUES } from '@/lib/courseOptions';

const { Schema, models, model } = mongoose;

/**
 * Lessons collection (Sprint 19.2) — the leaf tier of Course → Section →
 * Lesson. A separate top-level collection, same reasoning as
 * models/Section.js. Carries both `section` (its direct parent) and a
 * denormalized `course` ref — deliberate, not an oversight: lesson-level
 * operations (access checks, media serving, a future "last viewed lesson"
 * pointer on VerifiedLead) need the course id constantly, and requiring a
 * populate-through-section chain for every one of those would be needless
 * overhead. `Booking.price`/`memberDiscount` are this project's existing
 * precedent for a deliberate denormalized convenience field.
 *
 * `accessLevel` reuses lib/access/accessLevels.js's `ACCESS_LEVELS` — no
 * lesson-specific permission enum. `previewAvailable` is a separate,
 * lesson-specific escape hatch (a "free preview" lesson bypasses its own
 * accessLevel gate for *viewing*) — handled by the route/page that fetches
 * a lesson, not by canAccess() itself, which stays generic. See
 * docs/14_ACCESS_CONTROL.md.
 *
 * Media fields are always stored in private storage
 * (private-uploads/lessons-<kind>/ via lib/privateUpload.js) regardless of
 * accessLevel, and only ever served through a gated route — never a public
 * static path. This matches Sprint 12.5's protected-download precedent
 * (docs/13_DECISIONS.md): a lesson's accessLevel can change after upload,
 * and a stale public URL would otherwise bypass the new gate.
 *
 * `attachments` covers the brief's "Attachments" and "Downloadable
 * Resources" as one field, not two — both describe the exact same
 * technical concept (a file attached to the lesson for download), unlike
 * Course's `learningOutcomes`/`whatYoullLearn`, which the brief lists
 * separately because they render as two distinct marketing sections. See
 * docs/13_DECISIONS.md.
 */
const LessonSchema = new Schema(
  {
    section: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      required: [true, 'Section is required'],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    // Scoped to siblings within the same section.
    displayOrder: {
      type: Number,
      default: 0,
    },
    lessonType: {
      type: String,
      enum: LESSON_TYPE_VALUES,
      default: 'text',
    },
    estimatedDuration: {
      type: Number,
      default: 0,
      min: [0, 'Estimated duration cannot be negative'],
    },
    previewAvailable: {
      type: Boolean,
      default: false,
    },
    accessLevel: {
      type: String,
      enum: ACCESS_LEVEL_VALUES,
      default: ACCESS_LEVELS.PUBLIC,
    },
    // Populated depending on `lessonType` — never validated as mutually
    // exclusive server-side (an admin switching lessonType keeps whatever
    // was previously uploaded rather than losing it, same "no destructive
    // cross-field validation" leniency as Product's optional pricing
    // fields defaulting rather than requiring).
    video: {
      url: { type: String, default: '' }, // private storage key, resolved via the gated media route
      filename: { type: String, default: '' },
    },
    pdf: {
      url: { type: String, default: '' },
      filename: { type: String, default: '' },
    },
    image: {
      url: { type: String, default: '' },
      alt: { type: String, trim: true, maxlength: 150, default: '' },
    },
    externalUrl: {
      type: String,
      trim: true,
      default: '',
    },
    // Rich text body for lessonType 'text' — same HTML-string convention as
    // Blog.content / Course.longDescription.
    body: {
      type: String,
      trim: true,
      default: '',
    },
    attachments: {
      type: [
        {
          url: { type: String, default: '' },
          filename: { type: String, default: '' },
          label: { type: String, trim: true, maxlength: 150, default: '' },
          _id: false,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

LessonSchema.index({ section: 1, displayOrder: 1 });
LessonSchema.index({ course: 1 });

LessonSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    section: this.section,
    course: this.course,
    title: this.title,
    description: this.description,
    displayOrder: this.displayOrder,
    lessonType: this.lessonType,
    estimatedDuration: this.estimatedDuration,
    previewAvailable: this.previewAvailable,
    accessLevel: this.accessLevel,
    video: this.video,
    pdf: this.pdf,
    image: this.image,
    externalUrl: this.externalUrl,
    body: this.body,
    attachments: this.attachments,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.Lesson || model('Lesson', LessonSchema);
