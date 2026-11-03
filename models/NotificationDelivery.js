import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * Minimal operational trail for user-facing notifications. Recipient values
 * and rendered content intentionally never enter this collection: Booking is
 * the authoritative, access-controlled source when an admin needs context.
 */
const NotificationDeliverySchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    notificationType: {
      type: String,
      enum: ['booking-created', 'booking-confirmed', 'booking-cancelled'],
      required: true,
    },
    channel: { type: String, enum: ['email', 'sms'], required: true },
    provider: { type: String, required: true, trim: true, maxlength: 50 },
    status: { type: String, enum: ['queued', 'sent', 'failed'], required: true, default: 'queued' },
    providerRef: { type: String, trim: true, maxlength: 200, default: '' },
    failureCode: { type: String, trim: true, maxlength: 80, default: '' },
    attemptedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

NotificationDeliverySchema.index({ booking: 1, createdAt: -1 });

export default models.NotificationDelivery || model('NotificationDelivery', NotificationDeliverySchema);
