import { requireAuth } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { saveUploadedImage } from '@/lib/localUpload';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/courses/upload — multipart/form-data with a single `file`
 * field. Used for the course thumbnail, banner, and instructor photo (all
 * public images — a course's own listing/marketing assets are never
 * access-gated, only its lesson content is). Same
 * lib/localUpload.js pattern as every other module's upload route.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  const result = await saveUploadedImage(request, 'courses');
  if (result.error) return result.error;

  return ok({ url: result.url }, 201);
});
