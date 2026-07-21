import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Resource from '@/models/Resource';
import ResourceFile from '@/models/ResourceFile';
import { fail, withErrorHandling } from '@/lib/apiResponse';
import { getCurrentActor } from '@/lib/access/actor';
import { canAccess } from '@/lib/access/canAccess';
import { readProtectedFile } from '@/lib/privateUpload';
import { mimeFromFilename } from '@/lib/fileMime';
import { recordDownload } from '@/lib/downloadLog';

export const dynamic = 'force-dynamic';

/**
 * GET /api/resource-files/[fileId]?action=view|download
 *
 * Sprint 19.3 — the streaming route for Resource files gated by
 * MEMBER/PURCHASED/ADMIN/PUBLIC access levels (session-based, via
 * lib/access/canAccess.js), directly mirroring
 * app/api/lessons/[id]/media/route.js. A flat, single-id path — same
 * reason Lesson media lives at /api/lessons/[id]/media rather than nested
 * under /api/courses/[id]/...: nesting this under /api/resources/[id]/...
 * would collide with the public /api/resources/[slug] route, since
 * Next.js requires every dynamic segment at the same path level to share
 * one param name. `ResourceFile._id` is already globally unique, so no
 * parent id is needed in the URL — the file's own `resource` ref is
 * resolved server-side instead.
 *
 * Files with `accessLevel: 'OTP'` are NOT served here for non-admins —
 * they go through the existing, unchanged app/api/verify/* flow instead
 * (a `resource` entry is registered in
 * lib/verification/resourceRegistry.js for that purpose). An admin
 * session is let through regardless, same admin-preview override
 * canAccess() already applies everywhere else.
 *
 * `action=view` serves inline (Content-Disposition: inline) for the
 * "Responsive Resource Viewer" preview; `action=download` (default)
 * requires `file.downloadable !== false` and serves as an attachment,
 * additionally writing a best-effort DownloadLog entry.
 */
export const GET = withErrorHandling(async (request, { params }) => {
  if (!mongoose.Types.ObjectId.isValid(params.fileId)) {
    return fail('Invalid file id', 400);
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') === 'view' ? 'view' : 'download';

  await connectDB();

  const file = await ResourceFile.findOne({ _id: params.fileId, deletedAt: null });
  if (!file) return fail('File not found', 404);

  const resource = await Resource.findById(file.resource).select('status deletedAt').lean();
  const actor = await getCurrentActor(request);

  if (file.accessLevel === 'OTP' && !actor.user) {
    return fail('This file requires OTP verification — use /api/verify/generate-otp', 400);
  }

  // Don't leak the existence of a draft/deleted resource's file to a
  // non-admin, even if the file happens to be a free preview.
  if ((resource?.status !== 'published' || resource?.deletedAt) && !actor.user) {
    return fail('File not found', 404);
  }

  const allowed =
    file.previewAvailable ||
    canAccess(
      { accessLevel: file.accessLevel, resourceType: 'resource', resourceId: file.resource },
      actor
    ).allowed;

  if (!allowed) {
    return fail('You do not have access to this file', 403);
  }

  if (action === 'download' && file.downloadable === false) {
    return fail('This file is not available for download', 403);
  }

  if (file.fileType === 'external_link') {
    return fail('External links have no file to stream', 400);
  }

  if (!file.file?.url) {
    return fail('File not available for this resource', 404);
  }

  let buffer;
  try {
    buffer = await readProtectedFile('resources-files', file.file.url);
  } catch (err) {
    return fail('File not found', 404);
  }

  if (action === 'download') {
    await recordDownload({
      resourceType: 'resource',
      resourceId: file.resource,
      fileKind: params.fileId,
      fileLabel: file.title,
      lead: actor.lead,
    });
  }

  const disposition = action === 'download' ? 'attachment' : 'inline';
  const downloadName = (file.file.filename || file.file.url).replace(/"/g, '');

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': file.file.mimeType || mimeFromFilename(file.file.url),
      'Content-Disposition': `${disposition}; filename="${downloadName}"`,
      'Cache-Control': action === 'download' ? 'no-store' : 'private, no-store',
    },
  });
});
