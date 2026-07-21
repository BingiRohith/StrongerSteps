import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Resource from '@/models/Resource';
import ResourceCategory from '@/models/ResourceCategory'; // eslint-disable-line no-unused-vars -- registers the ref before populate
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { isValidAccessLevel } from '@/lib/access/accessLevels';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/resources
 * Query params: status ('draft'|'published'), category (id), search
 * (text), trashed ('true' to include soft-deleted rows — default
 * excludes them). No pagination — mirrors app/api/admin/courses/route.js.
 */
export const GET = withErrorHandling(async (request) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const search = searchParams.get('search')?.trim();
  const trashed = searchParams.get('trashed') === 'true';

  const query = trashed ? {} : { deletedAt: null };
  if (status && ['draft', 'published'].includes(status)) query.status = status;
  if (category && mongoose.Types.ObjectId.isValid(category)) query.category = category;
  if (search) query.$text = { $search: search };

  const resources = await Resource.find(query)
    .populate('createdBy', 'name')
    .populate('category', 'name slug')
    .sort({ displayOrder: 1, title: 1 })
    .lean();

  return ok({ resources });
});

/**
 * POST /api/admin/resources
 * Body: title, category (valid ResourceCategory id) required. `status`
 * may be 'draft' (default) or 'published'.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  await connectDB();

  const body = await request.json();

  if (!body?.title?.trim()) return fail('Resource title is required', 400);
  if (!body?.category || !mongoose.Types.ObjectId.isValid(body.category)) {
    return fail('A valid category is required', 400);
  }
  const categoryExists = await ResourceCategory.exists({ _id: body.category });
  if (!categoryExists) return fail('Category not found', 400);

  const accessLevel = isValidAccessLevel(body.accessLevel) ? body.accessLevel : 'PUBLIC';

  const resource = await Resource.create({
    title: body.title,
    slug: body.slug || undefined,
    description: body.description || '',
    longDescription: body.longDescription || '',
    thumbnail: { url: body.thumbnail?.url || '', alt: body.thumbnail?.alt || '' },
    banner: { url: body.banner?.url || '', alt: body.banner?.alt || '' },
    category: body.category,
    tags: Array.isArray(body.tags) ? body.tags : [],
    keywords: Array.isArray(body.keywords) ? body.keywords : [],
    author: body.author || '',
    estimatedReadingTime: Math.max(0, Number(body.estimatedReadingTime) || 0),
    language: body.language || 'English',
    featured: Boolean(body.featured),
    displayOrder: Number.isFinite(body.displayOrder) ? body.displayOrder : 0,
    accessLevel,
    status: body.status === 'published' ? 'published' : 'draft',
    seo: {
      title: body.seo?.title || '',
      metaDescription: body.seo?.metaDescription || '',
    },
    createdBy: user._id,
    updatedBy: user._id,
  });

  return ok({ resource }, 201);
});
