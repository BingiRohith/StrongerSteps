import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Event from '@/models/Event';
import Booking from '@/models/Booking';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { isValidEmail, isValidMobile } from '@/lib/eventValidation';
import { generateBookingReference } from '@/lib/bookingReference';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings — public "Book Your Seat" submission.
 * Body: { eventId, name, mobile, email }
 *
 * No payment step this sprint, so the booking is created directly as
 * 'confirmed' (see models/Booking.js for why the status enum still
 * supports a future pending/payment flow). Seat availability is enforced
 * with an atomic findOneAndUpdate so two concurrent bookings can't both
 * claim the last seat.
 */
export const POST = withErrorHandling(async (request) => {
  await connectDB();

  const body = await request.json();
  const { eventId, name, mobile, email } = body || {};

  if (!mongoose.Types.ObjectId.isValid(eventId)) return fail('Invalid event', 400);
  if (!name?.trim()) return fail('Name is required', 400);
  if (!isValidMobile(mobile)) return fail('Please enter a valid mobile number', 400);
  if (!isValidEmail(email)) return fail('Please enter a valid email address', 400);

  const existing = await Event.findOne({ _id: eventId, status: 'published' });
  if (!existing) return fail('This event is not available for booking', 404);

  const now = new Date();
  if (existing.registrationOpens && now < existing.registrationOpens) {
    return fail('Registration has not opened yet for this event', 400);
  }
  if (existing.registrationCloses && now > existing.registrationCloses) {
    return fail('Registration is closed for this event', 400);
  }

  // Atomic decrement — only succeeds if a seat is still available, so two
  // simultaneous requests can't both claim the last seat.
  const event = await Event.findOneAndUpdate(
    { _id: eventId, status: 'published', availableSeats: { $gt: 0 } },
    { $inc: { availableSeats: -1 } },
    { new: true }
  );
  if (!event) return fail('This event is fully booked', 409);

  let booking;
  for (let attempt = 0; attempt < 5 && !booking; attempt += 1) {
    try {
      const bookingReference = await generateBookingReference(Booking);
      booking = await Booking.create({
        event: event._id,
        bookingReference,
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim().toLowerCase(),
        price: event.price,
        memberDiscount: event.memberDiscountPercentage,
        finalAmount: event.price,
        bookingStatus: 'confirmed',
      });
    } catch (err) {
      if (err?.code === 11000 && err.keyPattern?.bookingReference) continue;
      // Roll back the seat decrement if booking creation failed for any other reason.
      await Event.updateOne({ _id: event._id }, { $inc: { availableSeats: 1 } });
      throw err;
    }
  }

  if (!booking) {
    await Event.updateOne({ _id: event._id }, { $inc: { availableSeats: 1 } });
    return fail('Could not complete booking. Please try again.', 500);
  }

  return ok({ booking, event }, 201);
});
