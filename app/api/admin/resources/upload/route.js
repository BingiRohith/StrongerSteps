import { requireAuth } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { saveUploadedImage } from '@/lib/localUpload';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/resources/upload — multipart/form-data with a single
 * `file` field. Used for the resource thumbnail and banner (both public
 * images — a resource's own listing/marketing assets are never
 * access-gated, only its downloadable files are). Same lib/localUpload.js
 * pattern as every other module's upload route (e.g.
 * app/api/admin/courses/upload/route.js).
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  const result = await saveUploadedImage(request, 'resources');
  if (result.error) return result.error;

  return ok({ url: result.url }, 201);
});
