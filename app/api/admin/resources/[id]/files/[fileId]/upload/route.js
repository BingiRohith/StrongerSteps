import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import ResourceFile from '@/models/ResourceFile';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import {
  saveProtectedImage,
  saveProtectedPdf,
  saveProtectedVideo,
  saveProtectedDocument,
  saveProtectedZip,
  saveProtectedAudio,
} from '@/lib/privateUpload';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/resources/:id/files/:fileId/upload?mediaType=video|pdf|image|document|zip|audio
 *
 * multipart/form-data: `file` only — `mediaType` is a query param, not a
 * form field, same reasoning as
 * app/api/admin/courses/.../lessons/[lessonId]/upload/route.js (each
 * saveProtected* helper reads request.formData() itself; reading it twice
 * would throw). Always writes to private storage
 * (private-uploads/resources-files/) regardless of the file's current
 * accessLevel — see models/ResourceFile.js's header comment. Returns
 * `{url, filename, mimeType, sizeBytes}`, a private storage key plus
 * provider-agnostic metadata — the admin form PUTs this onto the
 * ResourceFile's `file` field afterward (bumping `currentVersion`
 * server-side if this is a replacement, see .../files/[fileId]/route.js).
 * `external_link` files never call this route.
 */
export const POST = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id) || !mongoose.Types.ObjectId.isValid(params.fileId)) {
    return fail('Invalid id', 400);
  }

  await connectDB();
  const fileExists = await ResourceFile.exists({ _id: params.fileId, resource: params.id, deletedAt: null });
  if (!fileExists) return fail('File not found', 404);

  const { searchParams } = new URL(request.url);
  const mediaType = searchParams.get('mediaType');

  let result;
  if (mediaType === 'video') {
    result = await saveProtectedVideo(request, 'resources-files');
  } else if (mediaType === 'pdf') {
    result = await saveProtectedPdf(request, 'resources-files');
  } else if (mediaType === 'image') {
    result = await saveProtectedImage(request, 'resources-files');
  } else if (mediaType === 'document') {
    result = await saveProtectedDocument(request, 'resources-files');
  } else if (mediaType === 'zip') {
    result = await saveProtectedZip(request, 'resources-files');
  } else if (mediaType === 'audio') {
    result = await saveProtectedAudio(request, 'resources-files');
  } else {
    return fail("mediaType must be 'video', 'pdf', 'image', 'document', 'zip', or 'audio'", 400);
  }

  if (result.error) return result.error;

  return ok({ url: result.url, filename: result.filename, mimeType: result.mimeType, sizeBytes: result.sizeBytes }, 201);
});
