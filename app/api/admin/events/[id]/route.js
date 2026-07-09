import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Event from '@/models/Event';
import { EVENT_TYPE_VALUES } from '@/lib/eventOptions';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid event id', 400);

  await connectDB();
  const event = await Event.findById(params.id).populate('author', 'name');
  if (!event) return fail('Event not found', 404);

  return ok({ event });
});

/**
 * PUT /api/admin/events/:id — full update. Any subset of event fields may
 * be sent; only the fields present in the body are applied. Also used by
 * the admin list's reorder (up/down) controls to swap `displayOrder`
 * between two adjacent events.
 */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid event id', 400);

  await connectDB();
  const event = await Event.findById(params.id);
  if (!event) return fail('Event not found', 404);

  const body = await request.json();

  if (body.title !== undefined) {
    if (!body.title.trim()) return fail('Title is required', 400);
    event.title = body.title;
  }
  if (body.slug !== undefined) event.slug = body.slug;
  if (body.shortDescription !== undefined) event.shortDescription = body.shortDescription;
  if (body.fullDescription !== undefined) event.fullDescription = body.fullDescription;
  if (body.eventType !== undefined) {
    if (!EVENT_TYPE_VALUES.includes(body.eventType)) return fail('Invalid event type', 400);
    event.eventType = body.eventType;
  }
  if (body.image !== undefined) {
    event.image = { url: body.image?.url || '', alt: body.image?.alt || '' };
  }
  if (body.eventDate !== undefined) {
    if (!body.eventDate) return fail('Event date is required', 400);
    event.eventDate = body.eventDate;
  }
  if (body.startTime !== undefined) {
    if (!body.startTime.trim()) return fail('Start time is required', 400);
    event.startTime = body.startTime;
  }
  if (body.endTime !== undefined) {
    if (!body.endTime.trim()) return fail('End time is required', 400);
    event.endTime = body.endTime;
  }
  if (body.location !== undefined) {
    if (!body.location.trim()) return fail('Location is required', 400);
    event.location = body.location;
  }
  if (body.mapLink !== undefined) event.mapLink = body.mapLink;
  if (body.hostName !== undefined) {
    if (!body.hostName.trim()) return fail('Host name is required', 400);
    event.hostName = body.hostName;
  }
  if (body.hostImage !== undefined) {
    event.hostImage = { url: body.hostImage?.url || '', alt: body.hostImage?.alt || '' };
  }
  if (body.price !== undefined) {
    const price = Number(body.price) || 0;
    if (price < 0) return fail('Price cannot be negative', 400);
    event.price = price;
  }
  if (body.memberDiscountPercentage !== undefined) {
    event.memberDiscountPercentage = Math.min(100, Math.max(0, Number(body.memberDiscountPercentage) || 0));
  }
  if (body.maxSeats !== undefined) {
    const maxSeats = Number(body.maxSeats);
    if (!Number.isFinite(maxSeats) || maxSeats < 1) return fail('Maximum seats must be at least 1', 400);
    event.maxSeats = maxSeats;
  }
  if (body.availableSeats !== undefined) {
    const availableSeats = Number(body.availableSeats);
    if (!Number.isFinite(availableSeats) || availableSeats < 0) {
      return fail('Available seats cannot be negative', 400);
    }
    event.availableSeats = availableSeats;
  }
  if (body.status !== undefined) {
    if (!['draft', 'published'].includes(body.status)) return fail('Invalid status', 400);
    event.status = body.status;
  }
  if (body.displayOrder !== undefined) {
    event.displayOrder = Number.isFinite(body.displayOrder) ? body.displayOrder : 0;
  }
  if (body.featured !== undefined) event.featured = Boolean(body.featured);
  if (body.registrationOpens !== undefined) event.registrationOpens = body.registrationOpens || null;
  if (body.registrationCloses !== undefined) event.registrationCloses = body.registrationCloses || null;

  // Cross-field check on the resulting values (not just whichever field was
  // in this request) — catches both "set availableSeats too high" and
  // "shrink maxSeats below the current availableSeats" — mirrors Product's
  // sellingPrice <= originalPrice validation.
  if (event.availableSeats > event.maxSeats) {
    return fail('Available seats cannot exceed maximum seats', 400);
  }

  await event.save();

  return ok({ event });
});

export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid event id', 400);

  await connectDB();
  const event = await Event.findByIdAndDelete(params.id);
  if (!event) return fail('Event not found', 404);

  return ok({ deleted: true });
});
