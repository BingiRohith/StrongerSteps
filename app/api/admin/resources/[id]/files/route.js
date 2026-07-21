import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Resource from '@/models/Resource';
import ResourceFile from '@/models/ResourceFile';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { FILE_TYPE_VALUES } from '@/lib/resourceOptions';
import { isValidAccessLevel } from '@/lib/access/accessLevels';
import { refreshResourceFileTypes } from '@/lib/resourceFileTypes';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/resources/:id/files — every file for one resource,
 * ordered for the admin files manager. Excludes soft-deleted files. No
 * pagination — a resource's file count stays small, same convention as
 * app/api/admin/courses/[id]/sections/route.js.
 */
export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid resource id', 400);

  await connectDB();
  const files = await ResourceFile.find({ resource: params.id, deletedAt: null })
    .sort({ displayOrder: 1 })
    .lean();

  return ok({ files });
});

/**
 * POST /api/admin/resources/:id/files
 * Body: title, fileType (required). The binary itself is uploaded
 * afterward via POST .../files/:fileId/upload, then PUT onto this
 * record's `file` field — same two-step "create the doc, then attach
 * media" flow app/api/admin/courses/.../lessons/route.js already uses.
 */
export const POST = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid resource id', 400);

  await connectDB();
  const resource = await Resource.exists({ _id: params.id, deletedAt: null });
  if (!resource) return fail('Resource not found', 404);

  const body = await request.json();
  if (!body?.title?.trim()) return fail('File title is required', 400);
  if (!FILE_TYPE_VALUES.includes(body.fileType)) return fail('A valid file type is required', 400);

  const file = await ResourceFile.create({
    resource: params.id,
    title: body.title,
    description: body.description || '',
    fileType: body.fileType,
    displayOrder: Number.isFinite(body.displayOrder) ? body.displayOrder : 0,
    previewAvailable: Boolean(body.previewAvailable),
    downloadable: body.downloadable !== undefined ? Boolean(body.downloadable) : true,
    accessLevel: isValidAccessLevel(body.accessLevel) ? body.accessLevel : 'PUBLIC',
    externalUrl: body.fileType === 'external_link' ? body.externalUrl || '' : '',
  });

  await refreshResourceFileTypes(params.id);

  return ok({ file }, 201);
});
