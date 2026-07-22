import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * Team collection — originally fed the About page's illustrated
 * Organization Tree (Sprint 14 rev. 2; before that a flat "Meet the
 * founders" / "Our Team" grid, Sprint 9; a plain connector-line org chart
 * in the first Sprint 14 pass, rejected by the client for not matching
 * their reference — see `docs/13_DECISIONS.md`). As of Sprint 19.4 the
 * public page renders a flat responsive card grid again
 * (`components/team/TeamGrid.js`) instead of the tree — a client decision
 * documented in this project's memory system, not yet reflected in
 * `docs/03_CLIENT_REQUIREMENTS.md` §11 (pending the Sprint 19.4
 * documentation phase).
 *
 * `parentMember`/`xPosition`/`yPosition` are kept, **unused**, rather than
 * migrated away: Sprint 19.4 only removed the tree *presentation* layer
 * (`components/team/OrgTree.js` and friends, deleted), so there was no
 * reason to touch data that existing documents already carry. Nothing
 * reads or writes these three fields anymore (no admin form field, no API
 * body handling) — they're inert legacy columns, safe to ignore or drop in
 * a future sprint.
 *
 * Mirrors the shape/conventions of `models/Blog.js` and
 * `models/Infographic.js` (draft/published lifecycle, photo sub-document
 * like coverImage, `featured` flag like Blog) so the admin CRUD and upload
 * flow feel consistent with the rest of the admin panel. No slug/detail
 * page — team members don't have an individual public page. `status`
 * (draft/published) doubles as this feature's "Active/Inactive" toggle —
 * reused rather than adding a duplicate boolean. `designation` doubles as
 * the card's "Position" label. `specialization`/`contact` (Sprint 19.4)
 * are additive fields for the new card layout — same trimmed-array
 * convention as `qualifications` for the former, a plain optional
 * email/phone sub-document for the latter.
 */
const TeamSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
      maxlength: 150,
    },
    qualifications: {
      type: [String],
      default: [],
      set: (quals) =>
        Array.isArray(quals) ? quals.map((q) => q.trim()).filter(Boolean) : [],
    },
    specialization: {
      type: [String],
      default: [],
      set: (specs) =>
        Array.isArray(specs) ? specs.map((s) => s.trim()).filter(Boolean) : [],
    },
    contact: {
      email: { type: String, trim: true, lowercase: true, maxlength: 150, default: '' },
      phone: { type: String, trim: true, maxlength: 30, default: '' },
    },
    department: {
      type: String,
      trim: true,
      maxlength: 150,
      default: '',
    },
    parentMember: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    xPosition: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    yPosition: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    experience: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    photo: {
      url: { type: String, default: '' },
      alt: { type: String, trim: true, maxlength: 150, default: '' },
    },
    social: {
      linkedin: { type: String, trim: true, default: '' },
      twitter: { type: String, trim: true, default: '' },
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
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

TeamSchema.index({ status: 1, displayOrder: 1 });
TeamSchema.index({ status: 1, parentMember: 1, displayOrder: 1 });
TeamSchema.index({ name: 'text', designation: 'text', department: 'text', qualifications: 'text', bio: 'text' });

// Stamp/clear publishedAt when status flips — same pattern as Blog.js/Infographic.js.
TeamSchema.pre('validate', function prepareTeamMember(next) {
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

TeamSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    name: this.name,
    designation: this.designation,
    department: this.department,
    parentMember: this.parentMember,
    xPosition: this.xPosition,
    yPosition: this.yPosition,
    qualifications: this.qualifications,
    specialization: this.specialization,
    contact: this.contact,
    experience: this.experience,
    bio: this.bio,
    photo: this.photo,
    social: this.social,
    displayOrder: this.displayOrder,
    featured: this.featured,
    status: this.status,
    publishedAt: this.publishedAt,
    author: this.author,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.Team || model('Team', TeamSchema);
