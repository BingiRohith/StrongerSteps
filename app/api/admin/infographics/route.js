import connectDB from '@/lib/db';
import Infographic from '@/models/Infographic';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/infographics
 * Query params: status ('draft'|'published'), category, search (text),
 * page (default 1), limit (default 20). Mirrors app/api/admin/blogs/route.js.
 */
export const GET = withErrorHandling(async (request) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const search = searchParams.get('search')?.trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

  const query = {};
  if (status && ['draft', 'published'].includes(status)) query.status = status;
  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const [infographics, total] = await Promise.all([
    Infographic.find(query)
      .populate('author', 'name')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Infographic.countDocuments(query),
  ]);

  return ok({
    infographics,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

/**
 * POST /api/admin/infographics
 * Creates a new infographic. `status` may be 'draft' (default) or 'published'.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  await connectDB();

  const body = await request.json();

  if (!body?.title?.trim()) return fail('Title is required', 400);
  if (!body?.category?.trim()) return fail('Category is required', 400);

  const infographic = await Infographic.create({
    title: body.title,
    slug: body.slug || undefined,
    description: body.description || '',
    category: body.category,
    thumbnailImage: {
      url: body.thumbnailImage?.url || '',
      alt: body.thumbnailImage?.alt || '',
    },
    fullImage: {
      url: body.fullImage?.url || '',
      alt: body.fullImage?.alt || '',
    },
    pdf: {
      url: body.pdf?.url || '',
      filename: body.pdf?.filename || '',
    },
    seo: {
      title: body.seo?.title || '',
      metaDescription: body.seo?.metaDescription || '',
    },
    status: body.status === 'published' ? 'published' : 'draft',
    author: user._id,
  });

  return ok({ infographic }, 201);
});
