import mongoose from 'mongoose';
import { slugify, ensureUniqueSlug } from '@/lib/slugify';

const { Schema, models, model } = mongoose;

/**
 * Infographics collection — Knowledge Center's "Infographics" section.
 * Deliberately mirrors the shape/conventions of `models/Blog.js` (same
 * auto-slug approach, same draft/published lifecycle, same coverImage-style
 * sub-documents for images) so the admin CRUD, upload flow, and public query
 * helpers all feel consistent with the existing Blog module.
 *
 * `category` is a plain string (not a ref to `models/Category.js`) on
 * purpose: infographic topics (Delirium, Falls, DASH Diet, ...) are a
 * different taxonomy from blog categories, and this sprint doesn't ask for
 * a shared/relational category system for them — free text keeps the admin
 * form simple while `lib/publicInfographics.js` still derives a distinct
 * category list for the public filter chips from whatever values exist.
 */
const InfographicSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
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
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    thumbnailImage: {
      url: { type: String, default: '' },
      alt: { type: String, trim: true, maxlength: 150, default: '' },
    },
    // Sprint 12.5: `fullImage`/`pdf` are protected resources gated by OTP
    // verification (see lib/verification/). Their `url` is repurposed as a
    // private storage key (a bare filename under private-uploads/, written
    // by lib/privateUpload.js) rather than a public browsable path — resolved
    // only by app/api/infographics/[id]/preview-image (viewing fullImage)
    // and app/api/verify/download (downloading either). `thumbnailImage`
    // above is unaffected and stays public.
    fullImage: {
      url: { type: String, default: '' },
      alt: { type: String, trim: true, maxlength: 150, default: '' },
    },
    pdf: {
      url: { type: String, default: '' },
      filename: { type: String, trim: true, default: '' },
    },
    seo: {
      title: { type: String, trim: true, maxlength: 70, default: '' },
      metaDescription: { type: String, trim: true, maxlength: 160, default: '' },
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

InfographicSchema.index({ status: 1, createdAt: -1 });
InfographicSchema.index({ title: 'text', description: 'text', category: 'text' });

// Auto-generate a unique slug from the title (only when the title changes
// and the slug wasn't explicitly hand-edited to something else), and stamp/
// clear publishedAt when status flips — same pattern as Blog.js.
InfographicSchema.pre('validate', async function prepareInfographic(next) {
  try {
    const wantsRegeneration =
      this.isModified('slug') || !this.slug || this.isModified('title');

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

InfographicSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    title: this.title,
    slug: this.slug,
    description: this.description,
    category: this.category,
    thumbnailImage: this.thumbnailImage,
    fullImage: this.fullImage,
    pdf: this.pdf,
    seo: this.seo,
    status: this.status,
    publishedAt: this.publishedAt,
    author: this.author,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.Infographic || model('Infographic', InfographicSchema);
