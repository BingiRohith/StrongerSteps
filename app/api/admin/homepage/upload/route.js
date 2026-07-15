import { requireAuth } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { saveUploadedImage } from '@/lib/localUpload';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/homepage/upload — multipart/form-data with a single
 * `file` field. Same shared-helper pattern as
 * app/api/admin/membership/upload/route.js.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  const result = await saveUploadedImage(request, 'homepage');
  if (result.error) return result.error;

  return ok({ url: result.url }, 201);
});
