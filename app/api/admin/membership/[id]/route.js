import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Membership from '@/models/Membership';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { CURRENCY_VALUES, BILLING_PERIOD_VALUES, PLAN_THEME_VALUES } from '@/lib/membershipOptions';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid plan id', 400);

  await connectDB();
  const plan = await Membership.findById(params.id).populate('author', 'name');
  if (!plan) return fail('Plan not found', 404);

  return ok({ plan });
});

/**
 * PUT /api/admin/membership/:id — full update. Any subset of plan fields
 * may be sent; only the fields present in the body are applied. Also used
 * by the admin list's reorder (up/down) controls to swap `displayOrder`
 * between two adjacent plans.
 */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid plan id', 400);

  await connectDB();
  const plan = await Membership.findById(params.id);
  if (!plan) return fail('Plan not found', 404);

  const body = await request.json();

  if (body.name !== undefined) {
    if (!body.name.trim()) return fail('Plan name is required', 400);
    plan.name = body.name;
  }
  if (body.shortDescription !== undefined) {
    if (!body.shortDescription.trim()) return fail('Short description is required', 400);
    plan.shortDescription = body.shortDescription;
  }
  if (body.longDescription !== undefined) plan.longDescription = body.longDescription;
  if (body.price !== undefined) {
    const price = Number(body.price) || 0;
    if (price < 0) return fail('Price cannot be negative', 400);
    plan.price = price;
  }
  if (body.currency !== undefined) {
    if (!CURRENCY_VALUES.includes(body.currency)) return fail('Invalid currency', 400);
    plan.currency = body.currency;
  }
  if (body.billingPeriod !== undefined) {
    if (!BILLING_PERIOD_VALUES.includes(body.billingPeriod)) return fail('Invalid billing period', 400);
    plan.billingPeriod = body.billingPeriod;
  }
  if (body.discountPercentage !== undefined) {
    plan.discountPercentage = Math.min(100, Math.max(0, Number(body.discountPercentage) || 0));
  }
  if (body.status !== undefined) {
    if (!['active', 'inactive'].includes(body.status)) return fail('Invalid status', 400);
    plan.status = body.status;
  }
  if (body.featured !== undefined) plan.featured = Boolean(body.featured);
  if (body.badgeLabel !== undefined) plan.badgeLabel = body.badgeLabel;
  if (body.theme !== undefined) {
    if (!PLAN_THEME_VALUES.includes(body.theme)) return fail('Invalid theme', 400);
    plan.theme = body.theme;
  }
  if (body.displayOrder !== undefined) {
    plan.displayOrder = Number.isFinite(body.displayOrder) ? body.displayOrder : 0;
  }
  if (body.ctaLabel !== undefined) plan.ctaLabel = body.ctaLabel;
  if (body.ctaUrl !== undefined) plan.ctaUrl = body.ctaUrl;
  if (body.externalUrl !== undefined) plan.externalUrl = body.externalUrl;
  if (body.benefits !== undefined) {
    plan.benefits = Array.isArray(body.benefits) ? body.benefits : [];
  }
  if (body.image !== undefined) {
    plan.image = {
      url: body.image?.url || '',
      alt: body.image?.alt || '',
    };
  }

  await plan.save();

  return ok({ plan });
});

export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid plan id', 400);

  await connectDB();
  const plan = await Membership.findByIdAndDelete(params.id);
  if (!plan) return fail('Plan not found', 404);

  return ok({ deleted: true });
});
