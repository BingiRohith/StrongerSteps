import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import ResourceFile from '@/models/ResourceFile';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { FILE_TYPE_VALUES } from '@/lib/resourceOptions';
import { isValidAccessLevel } from '@/lib/access/accessLevels';
import { refreshResourceFileTypes } from '@/lib/resourceFileTypes';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function scopedQuery(params) {
  return { _id: params.fileId, resource: params.id, deletedAt: null };
}

export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.fileId)) return fail('Invalid id', 400);

  await connectDB();
  const file = await ResourceFile.findOne(scopedQuery(params));
  if (!file) return fail('File not found', 404);

  return ok({ file });
});

/**
 * PUT /api/admin/resources/:id/files/:fileId — partial update, including
 * the `file` sub-object (set after .../files/:fileId/upload returns a
 * storage key — `currentVersion` is bumped server-side whenever an
 * already-populated `file.url` is being replaced, not on first upload)
 * and the reorder controls' `displayOrder` swap within the same resource.
 */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.fileId)) return fail('Invalid id', 400);

  await connectDB();
  const file = await ResourceFile.findOne(scopedQuery(params));
  if (!file) return fail('File not found', 404);

  const body = await request.json();
  let fileTypeChanged = false;

  if (body.title !== undefined) {
    if (!body.title.trim()) return fail('File title is required', 400);
    file.title = body.title;
  }
  if (body.description !== undefined) file.description = body.description;
  if (body.fileType !== undefined) {
    if (!FILE_TYPE_VALUES.includes(body.fileType)) return fail('Invalid file type', 400);
    fileTypeChanged = file.fileType !== body.fileType;
    file.fileType = body.fileType;
  }
  if (body.displayOrder !== undefined) {
    file.displayOrder = Number.isFinite(body.displayOrder) ? body.displayOrder : 0;
  }
  if (body.previewAvailable !== undefined) file.previewAvailable = Boolean(body.previewAvailable);
  if (body.downloadable !== undefined) file.downloadable = Boolean(body.downloadable);
  if (body.accessLevel !== undefined) {
    if (!isValidAccessLevel(body.accessLevel)) return fail('Invalid access level', 400);
    file.accessLevel = body.accessLevel;
  }
  if (body.externalUrl !== undefined) file.externalUrl = body.externalUrl;
  if (body.file !== undefined) {
    const isReplacement = Boolean(file.file?.url) && file.file.url !== body.file?.url;
    file.file = {
      url: body.file?.url || '',
      filename: body.file?.filename || '',
      mimeType: body.file?.mimeType || '',
      sizeBytes: Number.isFinite(body.file?.sizeBytes) ? body.file.sizeBytes : 0,
      storageProvider: body.file?.storageProvider || 'local',
    };
    if (isReplacement) file.currentVersion += 1;
  }

  await file.save();

  if (fileTypeChanged) await refreshResourceFileTypes(params.id);

  return ok({ file });
});

/**
 * DELETE /api/admin/resources/:id/files/:fileId — soft delete, mirrors
 * models/Resource.js's soft-delete (see docs/13_DECISIONS.md). Refreshes
 * the parent Resource.fileTypes facet afterward.
 */
export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.fileId)) return fail('Invalid id', 400);

  await connectDB();
  const file = await ResourceFile.findOne(scopedQuery(params));
  if (!file) return fail('File not found', 404);

  file.deletedAt = new Date();
  await file.save();

  await refreshResourceFileTypes(params.id);

  return ok({ deleted: true });
});
