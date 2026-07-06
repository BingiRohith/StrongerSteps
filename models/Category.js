import mongoose from 'mongoose';
import { slugify } from '@/lib/slugify';

const { Schema, models, model } = mongoose;

/**
 * Minimal Categories collection. This sprint only needs it as the source
 * for Blog category selection (didn't exist yet in the uploaded project),
 * so it's intentionally lightweight — name + auto slug + optional
 * description. The full Categories admin management page is still a
 * placeholder and is out of scope for this sprint; `app/api/admin/categories`
 * exposes just enough (list + quick-create) for the Blog form's category
 * picker.
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
