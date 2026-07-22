import { requireAuth } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { saveUploadedImage } from '@/lib/localUpload';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/tools/upload — multipart/form-data with a single `file`
 * field. Used for the tool thumbnail and banner (public marketing images —
 * a tool's overview page is never access-gated, only the assessment
 * result is, see app/api/tools/[slug]/attempt/route.js). Same
 * lib/localUpload.js pattern as app/api/admin/resources/upload/route.js.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  const result = await saveUploadedImage(request, 'tools');
  if (result.error) return result.error;

  return ok({ url: result.url }, 201);
});
