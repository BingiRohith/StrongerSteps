import connectDB from '@/lib/db';
import { fail, withErrorHandling } from '@/lib/apiResponse';
import { verifyDownloadToken, stampDownload } from '@/lib/verification/verificationService';
import { getResourceConfig } from '@/lib/verification/resourceRegistry';
import { readProtectedFile } from '@/lib/privateUpload';
import { mimeFromFilename } from '@/lib/fileMime';

export const dynamic = 'force-dynamic';

/**
 * GET /api/verify/download?token=&fileKind=image|pdf — the only route that
 * ever hands out bytes for a protected resource. Requires the short-lived
 * signed token issued by POST /api/verify/verify-otp — there is no
 * permanent public URL for these files. Reusable across any resourceType
 * registered in lib/verification/resourceRegistry.js.
 */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const fileKind = searchParams.get('fileKind') || 'image';

  if (!token) {
    return fail('Missing download token', 401);
  }

  const verified = verifyDownloadToken(token);
  if (!verified.ok) {
    return fail(verified.error, verified.status);
  }

  const { resourceType, resourceId, verificationId } = verified.payload;
  const config = getResourceConfig(resourceType);
  if (!config) {
    return fail('Unsupported resource type', 400);
  }

  await connectDB();
  const resource = await config.model.findById(resourceId);
  if (!resource || !(await config.isAccessible(resource))) {
    return fail('Resource not found', 404);
  }

  const file = config.getFile(resource, fileKind);
  if (!file?.url) {
    return fail('File not available for this resource', 404);
  }

  const subdir = config.subdirFor(fileKind);
  let buffer;
  try {
    buffer = await readProtectedFile(subdir, file.url);
  } catch (err) {
    return fail('File not found', 404);
  }

  await stampDownload(verificationId);

  const downloadName = file.filename || file.url;

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': mimeFromFilename(file.url),
      'Content-Disposition': `attachment; filename="${downloadName.replace(/"/g, '')}"`,
      'Cache-Control': 'no-store',
    },
  });
});
