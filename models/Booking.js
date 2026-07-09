import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * Bookings collection — one row per "Book Your Seat" submission on the
 * public /programs calendar. `bookingStatus` uses a 4-value enum
 * (pending/confirmed/cancelled/expired) rather than a simple boolean so a
 * future payment integration slots in without a schema change: a booking
 * would be created `pending` while payment is in flight, then flipped to
 * `confirmed` (payment success), `cancelled` (user/admin action), or
 * `expired` (payment session timed out). Sprint 12 has no payment step, so
 * app/api/bookings/route.js creates bookings directly as `confirmed`.
 *
 * `memberId` and `notes` are unused this sprint (reserved for future
 * membership-account linking and attendee requirements like accessibility/
 * dietary needs) — kept optional so they need no migration later.
 *
 * `price`/`memberDiscount`/`finalAmount` are snapshots taken from the
 * Event at booking time so later edits to the event's pricing don't
 * retroactively change a past booking's amount. `memberDiscount` is
 * carried over but not subtracted into `finalAmount` yet — member-pricing
 * automation is an explicit Sprint 12 non-goal.
 */
const BookingSchema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    bookingReference: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    memberDiscount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    bookingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'expired'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

BookingSchema.index({ event: 1, createdAt: -1 });

BookingSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    event: this.event,
    memberId: this.memberId,
    bookingReference: this.bookingReference,
    name: this.name,
    mobile: this.mobile,
    email: this.email,
    notes: this.notes,
    bookingDate: this.bookingDate,
    price: this.price,
    memberDiscount: this.memberDiscount,
    finalAmount: this.finalAmount,
    bookingStatus: this.bookingStatus,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default models.Booking || model('Booking', BookingSchema);
