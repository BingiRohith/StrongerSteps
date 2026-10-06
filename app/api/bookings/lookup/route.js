import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import '@/models/Event';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { isValidMobile, last10Digits } from '@/lib/eventValidation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings/lookup?mobile=...&reference=... — public, no login.
 * Both values are required. A mobile number alone is easy to know or guess,
 * so it must never return a person's full booking history. Sprint 20 keeps
 * this as a single-booking status lookup until the production OTP provider
 * can prove ownership of the mobile number.
 *
 * The response also selects only fields rendered by the public UI. Email,
 * mobile and private notes stay server-side even for a correct lookup.
 */
export const GET = withErrorHandling(async (request) => {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const mobile = searchParams.get('mobile');
  const reference = searchParams.get('reference')?.trim();

  if (!isValidMobile(mobile)) return fail('Enter a valid 10-digit mobile number', 400);
  if (!reference) return fail('Booking reference is required', 400);

  const query = {
    mobile: new RegExp(`${last10Digits(mobile)}$`),
    bookingReference: reference.toUpperCase(),
  };

  const bookings = await Booking.find(query)
    .select('_id bookingReference name finalAmount bookingStatus event')
    .populate('event', 'title eventDate startTime endTime location')
    .sort({ createdAt: -1 })
    .limit(1)
    .lean();

  return ok({ bookings });
});
