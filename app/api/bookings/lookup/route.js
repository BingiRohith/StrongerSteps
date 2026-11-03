import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import '@/models/Event';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { isValidMobile, last10Digits } from '@/lib/eventValidation';
import { isRateLimited } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const LOOKUP_RATE_LIMIT = { max: 20, windowMs: 15 * 60 * 1000 };

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

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateLimitKey = `${last10Digits(mobile)}:${ip}`;
  if (isRateLimited(rateLimitKey, LOOKUP_RATE_LIMIT)) {
    return fail('Too many lookup attempts. Please try again in a few minutes.', 429);
  }

  const query = { mobile: new RegExp(`${last10Digits(mobile)}$`) };
  if (reference) query.bookingReference = reference.toUpperCase();

  const bookings = await Booking.find(query)
    .populate('event', 'title eventDate startTime endTime location')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return ok({ bookings });
});
