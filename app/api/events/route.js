import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { getPublishedEventsForMonth } from '@/lib/publicEvents';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events?year=YYYY&month=MM (1-12) — published events for a
 * single month, for the public /programs calendar's month navigation.
 * No auth; mirrors app/api/membership/route.js's thin-wrapper-over-a-lib-
 * helper pattern.
 */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = Number(searchParams.get('year')) || now.getFullYear();
  const month = Number(searchParams.get('month')) || now.getMonth() + 1;

  if (month < 1 || month > 12) return fail('Invalid month', 400);

  const events = await getPublishedEventsForMonth(year, month);

  return ok({ events });
});
