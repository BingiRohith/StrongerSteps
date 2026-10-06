import mongoose from 'mongoose';
import { slugify } from '@/lib/slugify';

const { Schema, models, model } = mongoose;

/**
 * Blog category data. Categories stay intentionally lightweight because
 * they are labels used to organize articles rather than publishable content
 * of their own. The admin CRUD screens manage these three fields directly.
 */
const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      maxlength: 80,
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
      maxlength: 300,
      default: '',
    },
  },
  { timestamps: true }
);

CategorySchema.pre('validate', function generateSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
  next();
});

export default models.Category || model('Category', CategorySchema);
