import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Tool from '@/models/Tool';
import ToolCategory from '@/models/ToolCategory'; // eslint-disable-line no-unused-vars -- registers the ref before populate
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { isValidAccessLevel } from '@/lib/access/accessLevels';
import { TOOL_TYPE_VALUES } from '@/lib/toolOptions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/tools
 * Query params: status ('draft'|'published'), category (id), search
 * (text). No pagination — mirrors app/api/admin/resources/route.js.
 */
export const GET = withErrorHandling(async (request) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const search = searchParams.get('search')?.trim();

  const query = {};
  if (status && ['draft', 'published'].includes(status)) query.status = status;
  if (category && mongoose.Types.ObjectId.isValid(category)) query.category = category;
  if (search) query.$text = { $search: search };

  const tools = await Tool.find(query)
    .populate('createdBy', 'name')
    .populate('category', 'name slug')
    .sort({ displayOrder: 1, title: 1 })
    .lean();

  return ok({ tools });
});

/**
 * POST /api/admin/tools
 * Body: title, category (valid ToolCategory id) required. `status` may be
 * 'draft' (default) or 'published'.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  await connectDB();

  const body = await request.json();

  if (!body?.title?.trim()) return fail('Tool title is required', 400);
  if (!body?.category || !mongoose.Types.ObjectId.isValid(body.category)) {
    return fail('A valid category is required', 400);
  }
  const categoryExists = await ToolCategory.exists({ _id: body.category });
  if (!categoryExists) return fail('Category not found', 400);

  const accessLevel = isValidAccessLevel(body.accessLevel) ? body.accessLevel : 'PUBLIC';
  const toolType = TOOL_TYPE_VALUES.includes(body.toolType) ? body.toolType : 'assessment';

  const tool = await Tool.create({
    title: body.title,
    slug: body.slug || undefined,
    description: body.description || '',
    longDescription: body.longDescription || '',
    thumbnail: { url: body.thumbnail?.url || '', alt: body.thumbnail?.alt || '' },
    banner: { url: body.banner?.url || '', alt: body.banner?.alt || '' },
    category: body.category,
    tags: Array.isArray(body.tags) ? body.tags : [],
    toolType,
    disclaimer: body.disclaimer || '',
    estimatedMinutes: Math.max(0, Number(body.estimatedMinutes) || 0),
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

  return ok({ tool }, 201);
});
