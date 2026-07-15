import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import '@/models/Event';
import { requireAuth } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  eventDate: { bookingDate: 1 },
  status: { bookingStatus: 1, createdAt: -1 },
};

/**
 * GET /api/admin/bookings
 * Query params: status ('pending'|'confirmed'|'cancelled'|'completed'),
 * search (matches name/mobile/email/bookingReference), sort (see SORTS).
 * No pagination — mirrors app/api/admin/events/route.js and
 * app/api/admin/products/route.js, both of which stay unpaginated too.
 */
export const GET = withErrorHandling(async (request) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search')?.trim();
  const sort = SORTS[searchParams.get('sort')] || SORTS.newest;

  const query = {};
  if (status && ['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
    query.bookingStatus = status;
  }
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = [{ name: regex }, { mobile: regex }, { email: regex }, { bookingReference: regex }];
  }

  const bookings = await Booking.find(query)
    .populate('event', 'title eventDate startTime endTime location maxSeats availableSeats')
    .sort(sort)
    .lean();

  return ok({ bookings });
});
