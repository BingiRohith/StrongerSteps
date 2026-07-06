import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB — headshot-sized, matches app/api/admin/upload/route.js
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'team');

function safeExt(filename, mimeType) {
  const fromName = path.extname(filename || '').toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fromName)) return fromName;
  const byMime = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
  return byMime[mimeType] || '.jpg';
}

/**
 * POST /api/admin/team/upload — multipart/form-data with a single `file`
 * field. Same local-disk pattern as app/api/admin/infographics/upload/route.js,
 * written to its own /public/uploads/team folder.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return fail('No file uploaded', 400);
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return fail('Only JPEG, PNG, WebP, or GIF images are allowed', 400);
  }
  if (file.size > MAX_SIZE_BYTES) {
    return fail('Image must be smaller than 5MB', 400);
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = safeExt(file.name, file.type);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return ok({ url: `/uploads/team/${filename}` }, 201);
});
