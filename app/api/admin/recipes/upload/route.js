import { requireAuth } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { saveUploadedImage } from '@/lib/localUpload';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/recipes/upload — multipart/form-data with a single `file`
 * field. Used for both the featured image and each gallery image (the
 * gallery admin UI calls this once per image and appends to the array
 * client-side). Uses the shared lib/localUpload.js helper, written to
 * /public/uploads/recipes — same pattern as app/api/admin/products/upload.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  const result = await saveUploadedImage(request, 'recipes');
  if (result.error) return result.error;

  return ok({ url: result.url }, 201);
});
