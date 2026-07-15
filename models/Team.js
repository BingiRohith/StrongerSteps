import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * Team collection — feeds the About page's illustrated Organization Tree
 * (Sprint 14 rev. 2; originally a flat "Meet the founders" / "Our Team"
 * grid, Sprint 9; a plain connector-line org chart in the first Sprint 14
 * pass, rejected by the client for not matching their reference — see
 * `docs/13_DECISIONS.md`). Mirrors the shape/conventions of `models/Blog.js`
 * and `models/Infographic.js` (draft/published lifecycle, photo sub-document
 * like coverImage, `featured` flag like Blog) so the admin CRUD and upload
 * flow feel consistent with the rest of the admin panel. No slug/detail
 * page — team members don't have an individual public page.
 *
 * `parentMember` (self-ref) still models the reporting relationship (used to
 * draw a connector line between a node and its parent's `xPosition`/
 * `yPosition`), but visual placement on the tree illustration is now
 * independent of it: `xPosition`/`yPosition` (0-100, percentage of the
 * illustration's width/height — `0,0` top-left, `100,100` bottom-right) are
 * admin-set directly via a drag-and-drop position editor
 * (`components/admin/team/TreePositionEditor.js`), not derived from the
 * hierarchy. `status` (draft/published) doubles as this feature's "Active/
 * Inactive" toggle — reused rather than adding a duplicate boolean.
 * `designation` doubles as the tree node's "Position" label.
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
