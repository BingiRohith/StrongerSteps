import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Tool from '@/models/Tool';
import ToolCategory from '@/models/ToolCategory';
import ToolSection from '@/models/ToolSection';
import ToolQuestion from '@/models/ToolQuestion';
import ToolResultBand from '@/models/ToolResultBand';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { isValidAccessLevel } from '@/lib/access/accessLevels';
import { TOOL_TYPE_VALUES } from '@/lib/toolOptions';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid tool id', 400);

  await connectDB();
  const tool = await Tool.findById(params.id)
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name')
    .populate('category', 'name slug');
  if (!tool) return fail('Tool not found', 404);

  return ok({ tool });
});

/**
 * PUT /api/admin/tools/:id — partial update. Any subset of tool fields may
 * be sent; only the fields present in the body are applied. Also used by
 * the admin list's reorder controls to swap `displayOrder` between two
 * adjacent tools.
 */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid tool id', 400);

  await connectDB();
  const tool = await Tool.findById(params.id);
  if (!tool) return fail('Tool not found', 404);

  const body = await request.json();

  if (body.title !== undefined) {
    if (!body.title.trim()) return fail('Tool title is required', 400);
    tool.title = body.title;
  }
  if (body.slug !== undefined) tool.slug = body.slug;
  if (body.description !== undefined) tool.description = body.description;
  if (body.longDescription !== undefined) tool.longDescription = body.longDescription;
  if (body.thumbnail !== undefined) {
    tool.thumbnail = { url: body.thumbnail?.url || '', alt: body.thumbnail?.alt || '' };
  }
  if (body.banner !== undefined) {
    tool.banner = { url: body.banner?.url || '', alt: body.banner?.alt || '' };
  }
  if (body.category !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(body.category)) return fail('A valid category is required', 400);
    const categoryExists = await ToolCategory.exists({ _id: body.category });
    if (!categoryExists) return fail('Category not found', 400);
    tool.category = body.category;
  }
  if (body.tags !== undefined) tool.tags = Array.isArray(body.tags) ? body.tags : [];
  if (body.toolType !== undefined) {
    if (!TOOL_TYPE_VALUES.includes(body.toolType)) return fail('Invalid tool type', 400);
    tool.toolType = body.toolType;
  }
  if (body.disclaimer !== undefined) tool.disclaimer = body.disclaimer;
  if (body.estimatedMinutes !== undefined) {
    tool.estimatedMinutes = Math.max(0, Number(body.estimatedMinutes) || 0);
  }
  if (body.featured !== undefined) tool.featured = Boolean(body.featured);
  if (body.displayOrder !== undefined) {
    tool.displayOrder = Number.isFinite(body.displayOrder) ? body.displayOrder : 0;
  }
  if (body.accessLevel !== undefined) {
    if (!isValidAccessLevel(body.accessLevel)) return fail('Invalid access level', 400);
    tool.accessLevel = body.accessLevel;
  }
  if (body.status !== undefined) {
    if (!['draft', 'published'].includes(body.status)) return fail('Invalid status', 400);
    tool.status = body.status;
  }
  if (body.seo !== undefined) {
    tool.seo = {
      title: body.seo?.title || '',
      metaDescription: body.seo?.metaDescription || '',
    };
  }

  tool.updatedBy = user._id;
  await tool.save();

  return ok({ tool });
});

/**
 * DELETE /api/admin/tools/:id — cascade-deletes its Sections, Questions,
 * and Result Bands, same reasoning as app/api/admin/courses/[id]/route.js
 * cascading to Section/Lesson: an orphaned ToolSection/ToolQuestion/
 * ToolResultBand has no admin list of its own to ever reach again.
 */
export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid tool id', 400);

  await connectDB();
  const tool = await Tool.findByIdAndDelete(params.id);
  if (!tool) return fail('Tool not found', 404);

  await Promise.all([
    ToolQuestion.deleteMany({ tool: params.id }),
    ToolSection.deleteMany({ tool: params.id }),
    ToolResultBand.deleteMany({ tool: params.id }),
  ]);

  return ok({ deleted: true });
});
