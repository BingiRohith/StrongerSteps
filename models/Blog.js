import mongoose from 'mongoose';
import { slugify, ensureUniqueSlug, estimateReadingTime } from '@/lib/slugify';

const { Schema, models, model } = mongoose;

const BlogSchema = new Schema(
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
    excerpt: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    coverImage: {
      url: { type: String, default: '' },
      alt: { type: String, trim: true, maxlength: 150, default: '' },
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
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
    seo: {
      title: { type: String, trim: true, maxlength: 70, default: '' },
      metaDescription: { type: String, trim: true, maxlength: 160, default: '' },
    },
    readingTime: {
      type: Number,
      default: 1,
      min: 1,
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
    featured: {
      type: Boolean,
      default: false,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

BlogSchema.index({ status: 1, createdAt: -1 });
BlogSchema.index({ featured: 1, publishedAt: -1 });
BlogSchema.index({ title: 'text', excerpt: 'text', tags: 'text' });

// Auto-generate a unique slug from the title (only when the title changes
// and the slug wasn't explicitly hand-edited to something else), and
// keep readingTime in sync with the current content on every save.
BlogSchema.pre('validate', async function prepareBlog(next) {
  try {
    // Priority: an explicit hand-edit of the slug field wins; otherwise the
    // slug is (re)derived from the title whenever the title changes or no
    // slug exists yet.
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

    if (this.isModified('content')) {
      this.readingTime = estimateReadingTime(this.content);
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

BlogSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    title: this.title,
    slug: this.slug,
    excerpt: this.excerpt,
    content: this.content,
    coverImage: this.coverImage,
    category: this.category,
    tags: this.tags,
    seo: this.seo,
    readingTime: this.readingTime,
    status: this.status,
    publishedAt: this.publishedAt,
    featured: this.featured,
    author: this.author,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.Blog || model('Blog', BlogSchema);
