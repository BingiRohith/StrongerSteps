import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import '@/models/Event';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { isValidMobile, last10Digits } from '@/lib/eventValidation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings/lookup?mobile=...&reference=... — public, no login.
 * Mobile number is the only identity credential (same one collected on the
 * booking form) — matched on its last 10 digits so it doesn't matter
 * whether a +91/91 prefix was typed either time. Powers both:
 *  - Booking History (mobile only): every booking for that number.
 *  - Single booking lookup (mobile + reference): "view booking details/
 *    status/reference" for one specific booking, reference alone isn't
 *    accepted so a guessed/sequential reference can't leak someone else's
 *    contact details.
 */
export const GET = withErrorHandling(async (request) => {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const mobile = searchParams.get('mobile');
  const reference = searchParams.get('reference')?.trim();

  if (!isValidMobile(mobile)) return fail('Enter a valid 10-digit mobile number', 400);

  const query = { mobile: new RegExp(`${last10Digits(mobile)}$`) };
  if (reference) query.bookingReference = reference.toUpperCase();

  const bookings = await Booking.find(query)
    .populate('event', 'title eventDate startTime endTime location')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return ok({ bookings });
});
