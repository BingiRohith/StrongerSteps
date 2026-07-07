import { requireAuth } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { saveUploadedImage } from '@/lib/localUpload';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/products/upload — multipart/form-data with a single
 * `file` field. Uses the shared lib/localUpload.js helper (same local-disk
 * pattern as app/api/admin/team/upload/route.js) written to its own
 * /public/uploads/products folder.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  const result = await saveUploadedImage(request, 'products');
  if (result.error) return result.error;

  return ok({ url: result.url }, 201);
});
