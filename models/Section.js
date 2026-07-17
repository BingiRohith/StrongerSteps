import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * Course Sections ("Modules") collection (Sprint 19.2) — the middle tier of
 * the Course → Section → Lesson hierarchy. A separate top-level collection
 * rather than an embedded array on Course, following this project's
 * established convention (every hierarchical relationship so far —
 * Team.parentMember, Booking.event — uses a separate collection + FK ref,
 * never nested sub-document CRUD) and because Lessons (the next tier down)
 * need their own stable top-level id for future per-lesson progress
 * tracking (see docs/14_ACCESS_CONTROL.md's extensibility note).
 *
 * No `status`/`accessLevel` of its own — a Section's visibility follows its
 * parent Course's `status`, and access gating happens at the Course and
 * Lesson level only, per the Sprint 19.2 brief.
 */
const SectionSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    title: {
      type: String,
      required: [true, 'Section title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    // Scoped to siblings within the same course — same convention as
    // models/Team.js's displayOrder (scoped to siblings sharing parentMember).
    displayOrder: {
      type: Number,
      default: 0,
    },
    collapsedByDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

SectionSchema.index({ course: 1, displayOrder: 1 });

SectionSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    course: this.course,
    title: this.title,
    description: this.description,
    displayOrder: this.displayOrder,
    collapsedByDefault: this.collapsedByDefault,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.Section || model('Section', SectionSchema);
