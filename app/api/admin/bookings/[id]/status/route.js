import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import Event from '@/models/Event';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];
// Every status except 'cancelled' holds a seat against the event's
// availableSeats count. Moving into/out of 'cancelled' is therefore the
// only transition that touches seat count — this covers both "Manual
// Cancellation" (any holding status -> cancelled, seat restored) and the
// admin re-activating a cancelled booking (cancelled -> any holding status,
// seat re-consumed if still available).
const HOLDS_SEAT = new Set(['pending', 'confirmed', 'completed']);

/**
 * PATCH /api/admin/bookings/:id/status — admin status change.
 * Body: { status: 'pending' | 'confirmed' | 'cancelled' | 'completed' }
 */
export const PATCH = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid booking id', 400);

  const body = await request.json();
  if (!STATUSES.includes(body?.status)) {
    return fail(`Status must be one of: ${STATUSES.join(', ')}`, 400);
  }

  await connectDB();
  const booking = await Booking.findById(params.id);
  if (!booking) return fail('Booking not found', 404);

  const nextStatus = body.status;
  const wasHolding = HOLDS_SEAT.has(booking.bookingStatus);
  const willHold = HOLDS_SEAT.has(nextStatus);

  if (nextStatus !== booking.bookingStatus) {
    if (wasHolding && !willHold) {
      // Restore the seat, capped at maxSeats via an aggregation-pipeline
      // update so the cap is enforced atomically alongside the increment.
      await Event.findByIdAndUpdate(booking.event, [
        { $set: { availableSeats: { $min: [{ $add: ['$availableSeats', 1] }, '$maxSeats'] } } },
      ]);
    } else if (!wasHolding && willHold) {
      // Re-activating a cancelled booking — only succeeds if a seat is
      // still free, same atomic guard as the public booking-creation route.
      const updatedEvent = await Event.findOneAndUpdate(
        { _id: booking.event, availableSeats: { $gt: 0 } },
        { $inc: { availableSeats: -1 } },
        { new: true }
      );
      if (!updatedEvent) {
        return fail('Cannot reactivate — no seats available for this event', 409);
      }
    }
    booking.bookingStatus = nextStatus;
    await booking.save();
  }

  await booking.populate('event', 'title eventDate startTime endTime location maxSeats availableSeats');

  return ok({ booking });
});
