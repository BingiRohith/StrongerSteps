import connectDB from '@/lib/db';
import Membership from '@/models/Membership';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { CURRENCY_VALUES, BILLING_PERIOD_VALUES, PLAN_THEME_VALUES } from '@/lib/membershipOptions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/membership
 * Query params: status ('active'|'inactive'), search (text).
 * No pagination — the plan catalog stays small. Mirrors
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
  if (status && ['active', 'inactive'].includes(status)) query.status = status;
  if (search) query.$text = { $search: search };

  const plans = await Membership.find(query)
    .populate('author', 'name')
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  return ok({ plans });
});

/**
 * POST /api/admin/membership
 * Creates a new membership plan. `status` may be 'inactive' (default) or
 * 'active'.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  await connectDB();

  const body = await request.json();

  if (!body?.name?.trim()) return fail('Plan name is required', 400);
  if (!body?.shortDescription?.trim()) return fail('Short description is required', 400);

  const price = Number(body.price) || 0;
  if (price < 0) return fail('Price cannot be negative', 400);

  const currency = CURRENCY_VALUES.includes(body.currency) ? body.currency : 'INR';
  const billingPeriod = BILLING_PERIOD_VALUES.includes(body.billingPeriod) ? body.billingPeriod : 'monthly';
  const theme = PLAN_THEME_VALUES.includes(body.theme) ? body.theme : 'sage';

  const plan = await Membership.create({
    name: body.name,
    shortDescription: body.shortDescription,
    longDescription: body.longDescription || '',
    price,
    currency,
    billingPeriod,
    discountPercentage: Math.min(100, Math.max(0, Number(body.discountPercentage) || 0)),
    status: body.status === 'active' ? 'active' : 'inactive',
    featured: Boolean(body.featured),
    badgeLabel: body.badgeLabel || '',
    theme,
    displayOrder: Number.isFinite(body.displayOrder) ? body.displayOrder : 0,
    ctaLabel: body.ctaLabel || 'Join Now',
    ctaUrl: body.ctaUrl || '',
    externalUrl: body.externalUrl || '',
    benefits: Array.isArray(body.benefits) ? body.benefits : [],
    image: {
      url: body.image?.url || '',
      alt: body.image?.alt || '',
    },
    author: user._id,
  });

  return ok({ plan }, 201);
});
