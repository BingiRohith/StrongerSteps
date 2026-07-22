import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * Sprint 19.5 — per-(lead, course) learning progress: resume pointer,
 * completed lessons, completion %. Its own top-level collection with a
 * `lead` foreign key, not an array on `VerifiedLead` — same direction
 * `models/DownloadLog.js` already took, per docs/14_ACCESS_CONTROL.md's rule
 * that an unbounded/growing per-lead history belongs in its own collection
 * (the doc's own worked example is "Assessment history"; per-lesson
 * completion history is the same shape of problem). Progress is only ever
 * written for a `VerifiedLead` — an unverified visitor can freely watch any
 * PUBLIC lesson, but nothing is persisted until they verify once via the
 * existing OTP flow (see app/api/lessons/[id]/progress/route.js).
 *
 * `completionPercent` is always server-computed from `completedLessons`
 * against the course's current lesson count — never accepted from the
 * client, same "computed, never trusted from the request" precedent as
 * `Product.discountPercentage`.
 */
const CourseProgressSchema = new Schema(
  {
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'VerifiedLead',
      required: [true, 'Lead is required'],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    completedLessons: {
      type: [
        {
          lesson: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
          completedAt: { type: Date, default: Date.now },
          _id: false,
        },
      ],
      default: [],
    },
    // The "resume learning" pointer — last lesson the lead viewed.
    currentLesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
    },
    completionPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastViewedAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One progress record per lead per course.
CourseProgressSchema.index({ lead: 1, course: 1 }, { unique: true });

CourseProgressSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    lead: this.lead,
    course: this.course,
    completedLessons: this.completedLessons,
    currentLesson: this.currentLesson,
    completionPercent: this.completionPercent,
    lastViewedAt: this.lastViewedAt,
    startedAt: this.startedAt,
    completedAt: this.completedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.CourseProgress || model('CourseProgress', CourseProgressSchema);
