import { requireAuth } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { saveProtectedPdf } from '@/lib/privateUpload';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/infographics/upload-pdf — multipart/form-data with a
 * single `file` field. Optional downloadable PDF companion for an
 * infographic. Sprint 12.5: moved from public/uploads/ to private storage
 * (lib/privateUpload.js) since PDFs are now a protected resource, only
 * ever served through the OTP-gated app/api/verify/download route — the
 * `url` field returned here is a private storage key, not a public path.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  const result = await saveProtectedPdf(request, 'infographics-pdfs');
  if (result.error) return result.error;

  return ok({ url: result.url, filename: result.filename }, 201);
});
