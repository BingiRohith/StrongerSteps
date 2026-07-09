import mongoose from 'mongoose';
import { EVENT_TYPE_VALUES } from '@/lib/eventOptions';

const { Schema, models, model } = mongoose;

/**
 * Events collection — powers the public /programs monthly calendar.
 * Mirrors models/Product.js (draft/published lifecycle, publishedAt
 * stamping, single image sub-document, toSafeObject()) so the admin CRUD
 * and upload flow feel consistent with the rest of the admin panel.
 *
 * `slug` is stored but unused this sprint — reserved for a future SEO
 * event detail page, no uniqueness/generation logic yet since there's
 * nowhere to route to. `eventType` is likewise informational only (no
 * filtering UI yet), for future reporting/categorization.
 */
const EventSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      trim: true,
      default: '',
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    fullDescription: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: '',
    },
    eventType: {
      type: String,
      enum: EVENT_TYPE_VALUES,
      default: 'Other',
    },
    image: {
      url: { type: String, default: '' },
      alt: { type: String, trim: true, maxlength: 150, default: '' },
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: 200,
    },
    mapLink: {
      type: String,
      trim: true,
      default: '',
    },
    hostName: {
      type: String,
      required: [true, 'Host name is required'],
      trim: true,
      maxlength: 100,
    },
    hostImage: {
      url: { type: String, default: '' },
      alt: { type: String, trim: true, maxlength: 150, default: '' },
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    memberDiscountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    maxSeats: {
      type: Number,
      required: [true, 'Maximum seats is required'],
      min: [1, 'Maximum seats must be at least 1'],
    },
    availableSeats: {
      type: Number,
      min: [0, 'Available seats cannot be negative'],
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    registrationOpens: {
      type: Date,
      default: null,
    },
    registrationCloses: {
      type: Date,
      default: null,
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

EventSchema.index({ status: 1, eventDate: 1, displayOrder: 1 });
EventSchema.index({ title: 'text', shortDescription: 'text', location: 'text' });

// Stamp/clear publishedAt when status flips — same pattern as Product.js/Team.js.
EventSchema.pre('validate', function preparePublish(next) {
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

// availableSeats defaults to maxSeats on creation only, unless the admin
// explicitly set it — after that, it's a directly admin-managed field
// (per CRS, seats are entered by admin, not purely derived) that bookings
// decrement.
EventSchema.pre('validate', function seedAvailableSeats(next) {
  if (this.isNew && (this.availableSeats === undefined || this.availableSeats === null)) {
    this.availableSeats = this.maxSeats;
  }
  next();
});

EventSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    title: this.title,
    slug: this.slug,
    shortDescription: this.shortDescription,
    fullDescription: this.fullDescription,
    eventType: this.eventType,
    image: this.image,
    eventDate: this.eventDate,
    startTime: this.startTime,
    endTime: this.endTime,
    location: this.location,
    mapLink: this.mapLink,
    hostName: this.hostName,
    hostImage: this.hostImage,
    price: this.price,
    memberDiscountPercentage: this.memberDiscountPercentage,
    maxSeats: this.maxSeats,
    availableSeats: this.availableSeats,
    status: this.status,
    displayOrder: this.displayOrder,
    featured: this.featured,
    registrationOpens: this.registrationOpens,
    registrationCloses: this.registrationCloses,
    publishedAt: this.publishedAt,
    author: this.author,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.Event || model('Event', EventSchema);
