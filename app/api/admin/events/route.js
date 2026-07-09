import connectDB from '@/lib/db';
import Event from '@/models/Event';
import { EVENT_TYPE_VALUES } from '@/lib/eventOptions';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/events
 * Query params: status ('draft'|'published'), search (text).
 * No pagination — the event catalog stays small. Mirrors
 * app/api/admin/products/route.js.
 */
export const GET = withErrorHandling(async (request) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search')?.trim();

  const query = {};
  if (status && ['draft', 'published'].includes(status)) query.status = status;
  if (search) query.$text = { $search: search };

  const events = await Event.find(query)
    .populate('author', 'name')
    .sort({ eventDate: 1, displayOrder: 1 })
    .lean();

  return ok({ events });
});

/**
 * POST /api/admin/events
 * Creates a new event. `status` may be 'draft' (default) or 'published'.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  await connectDB();

  const body = await request.json();

  if (!body?.title?.trim()) return fail('Title is required', 400);
  if (!body?.eventDate) return fail('Event date is required', 400);
  if (!body?.startTime?.trim()) return fail('Start time is required', 400);
  if (!body?.endTime?.trim()) return fail('End time is required', 400);
  if (!body?.location?.trim()) return fail('Location is required', 400);
  if (!body?.hostName?.trim()) return fail('Host name is required', 400);

  const maxSeats = Number(body.maxSeats);
  if (!Number.isFinite(maxSeats) || maxSeats < 1) {
    return fail('Maximum seats must be at least 1', 400);
  }

  const price = Number(body.price) || 0;
  if (price < 0) return fail('Price cannot be negative', 400);

  // availableSeats is left undefined (and defaulted to maxSeats by the
  // model's pre-validate hook) unless the admin explicitly sets it — but
  // when they do, it can never exceed maxSeats, mirroring Product's
  // sellingPrice <= originalPrice cross-field validation.
  let availableSeats;
  if (body.availableSeats !== undefined && body.availableSeats !== null) {
    availableSeats = Number(body.availableSeats);
    if (!Number.isFinite(availableSeats) || availableSeats < 0) {
      return fail('Available seats cannot be negative', 400);
    }
    if (availableSeats > maxSeats) {
      return fail('Available seats cannot exceed maximum seats', 400);
    }
  }

  const eventType = EVENT_TYPE_VALUES.includes(body.eventType) ? body.eventType : 'Other';

  const event = await Event.create({
    title: body.title,
    slug: body.slug || '',
    shortDescription: body.shortDescription || '',
    fullDescription: body.fullDescription || '',
    eventType,
    image: { url: body.image?.url || '', alt: body.image?.alt || '' },
    eventDate: body.eventDate,
    startTime: body.startTime,
    endTime: body.endTime,
    location: body.location,
    mapLink: body.mapLink || '',
    hostName: body.hostName,
    hostImage: { url: body.hostImage?.url || '', alt: body.hostImage?.alt || '' },
    price,
    memberDiscountPercentage: Math.min(100, Math.max(0, Number(body.memberDiscountPercentage) || 0)),
    maxSeats,
    availableSeats,
    status: body.status === 'published' ? 'published' : 'draft',
    displayOrder: Number.isFinite(body.displayOrder) ? body.displayOrder : 0,
    featured: Boolean(body.featured),
    registrationOpens: body.registrationOpens || null,
    registrationCloses: body.registrationCloses || null,
    author: user._id,
  });

  return ok({ event }, 201);
});
