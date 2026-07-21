import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Resource from '@/models/Resource';
import ResourceCategory from '@/models/ResourceCategory';
import ResourceFile from '@/models/ResourceFile';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { isValidAccessLevel } from '@/lib/access/accessLevels';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid resource id', 400);

  await connectDB();
  const resource = await Resource.findById(params.id)
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name')
    .populate('category', 'name slug');
  if (!resource) return fail('Resource not found', 404);

  return ok({ resource });
});

/**
 * PUT /api/admin/resources/:id — partial update. Any subset of resource
 * fields may be sent; only the fields present in the body are applied.
 * Also used by the admin list's reorder controls to swap `displayOrder`
 * between two adjacent resources, and by the "Restore" action
 * (`deletedAt: null`) on a soft-deleted resource.
 */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid resource id', 400);

  await connectDB();
  const resource = await Resource.findById(params.id);
  if (!resource) return fail('Resource not found', 404);

  const body = await request.json();

  if (body.title !== undefined) {
    if (!body.title.trim()) return fail('Resource title is required', 400);
    resource.title = body.title;
  }
  if (body.slug !== undefined) resource.slug = body.slug;
  if (body.description !== undefined) resource.description = body.description;
  if (body.longDescription !== undefined) resource.longDescription = body.longDescription;
  if (body.thumbnail !== undefined) {
    resource.thumbnail = { url: body.thumbnail?.url || '', alt: body.thumbnail?.alt || '' };
  }
  if (body.banner !== undefined) {
    resource.banner = { url: body.banner?.url || '', alt: body.banner?.alt || '' };
  }
  if (body.category !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(body.category)) return fail('A valid category is required', 400);
    const categoryExists = await ResourceCategory.exists({ _id: body.category });
    if (!categoryExists) return fail('Category not found', 400);
    resource.category = body.category;
  }
  if (body.tags !== undefined) resource.tags = Array.isArray(body.tags) ? body.tags : [];
  if (body.keywords !== undefined) resource.keywords = Array.isArray(body.keywords) ? body.keywords : [];
  if (body.author !== undefined) resource.author = body.author;
  if (body.estimatedReadingTime !== undefined) {
    resource.estimatedReadingTime = Math.max(0, Number(body.estimatedReadingTime) || 0);
  }
  if (body.language !== undefined) resource.language = body.language || 'English';
  if (body.featured !== undefined) resource.featured = Boolean(body.featured);
  if (body.displayOrder !== undefined) {
    resource.displayOrder = Number.isFinite(body.displayOrder) ? body.displayOrder : 0;
  }
  if (body.accessLevel !== undefined) {
    if (!isValidAccessLevel(body.accessLevel)) return fail('Invalid access level', 400);
    resource.accessLevel = body.accessLevel;
  }
  if (body.status !== undefined) {
    if (!['draft', 'published'].includes(body.status)) return fail('Invalid status', 400);
    resource.status = body.status;
  }
  if (body.seo !== undefined) {
    resource.seo = {
      title: body.seo?.title || '',
      metaDescription: body.seo?.metaDescription || '',
    };
  }
  // Restore a soft-deleted resource — the only way `deletedAt` is ever
  // cleared once set.
  if (body.deletedAt === null) resource.deletedAt = null;

  resource.updatedBy = user._id;
  await resource.save();

  return ok({ resource });
});

/**
 * DELETE /api/admin/resources/:id — soft delete. Sets `deletedAt` on the
 * resource and cascades to soft-deleting its ResourceFiles, the
 * non-destructive version of Course's existing hard-cascade-to-children
 * rule (an orphaned file would otherwise have no admin list of its own to
 * ever reach again). No hard-purge action is exposed this sprint — see
 * docs/13_DECISIONS.md.
 */
export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid resource id', 400);

  await connectDB();
  const resource = await Resource.findById(params.id);
  if (!resource) return fail('Resource not found', 404);

  const now = new Date();
  resource.deletedAt = now;
  resource.updatedBy = user._id;
  await resource.save();

  await ResourceFile.updateMany({ resource: params.id, deletedAt: null }, { deletedAt: now });

  return ok({ deleted: true });
});
