import connectDB from '@/lib/db';
import Event from '@/models/Event';

/**
 * Read-only query helper for the *public* /programs calendar and the
 * public `/api/events` route. Hard-scoped to `status: 'published'` —
 * draft events are never reachable from the public site, only from the
 * admin routes in `app/api/admin/events/*`. Mirrors `lib/publicMembership.js`.
 */

function serialize(doc) {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

export async function getPublishedEventsForMonth(year, month) {
  await connectDB();

  // month is 1-12 here; JS Date months are 0-11. Built in UTC because
  // eventDate is stored as UTC midnight (see models/Event.js /
  // lib/eventFormat.js's eventDateKey) — using local-time boundaries here
  // could clip the first/last day of the month depending on server timezone.
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startOfNextMonth = new Date(Date.UTC(year, month, 1));

  const events = await Event.find({
    status: 'published',
    eventDate: { $gte: startOfMonth, $lt: startOfNextMonth },
  })
    .sort({ eventDate: 1, displayOrder: 1 })
    .lean();

  return serialize(events);
}
