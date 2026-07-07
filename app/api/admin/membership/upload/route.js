import { requireAuth } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { saveUploadedImage } from '@/lib/localUpload';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/membership/upload — multipart/form-data with a single
 * `file` field. Uses the shared lib/localUpload.js helper (same local-disk
 * pattern as app/api/admin/products/upload/route.js) written to its own
 * /public/uploads/membership folder.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  const result = await saveUploadedImage(request, 'membership');
  if (result.error) return result.error;

  return ok({ url: result.url }, 201);
});
