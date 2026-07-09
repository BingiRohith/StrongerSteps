import { requireAuth } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { saveProtectedImage } from '@/lib/privateUpload';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/infographics/upload-full-image — multipart/form-data with
 * a single `file` field. New in Sprint 12.5: the infographic's full-size
 * image is a protected resource (gated download), unlike the thumbnail
 * (still public via /api/admin/infographics/upload, unchanged) — so it gets
 * its own route writing to private storage (lib/privateUpload.js) instead
 * of public/uploads/. The `url` field returned here is a private storage
 * key, resolved only by the infographic preview-image route (viewing) and
 * app/api/verify/download (downloading), never a browsable path.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  const result = await saveProtectedImage(request, 'infographics-full', { maxSizeBytes: 8 * 1024 * 1024 });
  if (result.error) return result.error;

  return ok({ url: result.url }, 201);
});
