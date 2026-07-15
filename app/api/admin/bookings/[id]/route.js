import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import '@/models/Event';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/** GET /api/admin/bookings/:id — full booking detail with its event populated. */
export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid booking id', 400);

  await connectDB();
  const booking = await Booking.findById(params.id).populate('event');
  if (!booking) return fail('Booking not found', 404);

  return ok({ booking });
});
