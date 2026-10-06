import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * Media is the catalogue for assets uploaded through the shared library.
 * Older module-specific uploads intentionally remain on disk without a row;
 * the library discovers those read-only so existing content needs no migration.
 */
const MediaSchema = new Schema(
  {
    url: { type: String, required: true, unique: true, trim: true },
    filename: { type: String, required: true, trim: true },
    originalName: { type: String, trim: true, default: '' },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    alt: { type: String, trim: true, maxlength: 150, default: '' },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

MediaSchema.index({ originalName: 'text', filename: 'text', alt: 'text' });

export default models.Media || model('Media', MediaSchema);
