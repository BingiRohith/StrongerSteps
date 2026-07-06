import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'infographics-pdfs');

/**
 * POST /api/admin/infographics/upload-pdf — multipart/form-data with a
 * single `file` field. Optional downloadable PDF companion for an
 * infographic. Same local-disk convention as the image upload routes;
 * response shape is `{ url, filename }` so the caller can store both the
 * public path and a human-friendly original filename for the download link.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return fail('No file uploaded', 400);
  }
  if (file.type !== 'application/pdf') {
    return fail('Only PDF files are allowed', 400);
  }
  if (file.size > MAX_SIZE_BYTES) {
    return fail('PDF must be smaller than 15MB', 400);
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return ok({ url: `/uploads/infographics-pdfs/${filename}`, filename: file.name || filename }, 201);
});
