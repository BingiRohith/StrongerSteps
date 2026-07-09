/**
 * Generates a human-readable booking reference like `SS-20260708-0001`
 * (date + a per-day sequence). The unique index on Booking.bookingReference
 * is the actual correctness guard against races; this count-then-format is
 * just to produce a short, sequential-looking number. Callers should retry
 * on a duplicate-key error from Booking.create (see app/api/bookings/route.js).
 */
export async function generateBookingReference(Booking) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfNextDay = new Date(startOfDay);
  startOfNextDay.setDate(startOfNextDay.getDate() + 1);

  const countToday = await Booking.countDocuments({
    createdAt: { $gte: startOfDay, $lt: startOfNextDay },
  });

  const datePart = `${startOfDay.getFullYear()}${String(startOfDay.getMonth() + 1).padStart(2, '0')}${String(
    startOfDay.getDate()
  ).padStart(2, '0')}`;
  const sequence = String(countToday + 1).padStart(4, '0');

  return `SS-${datePart}-${sequence}`;
}
