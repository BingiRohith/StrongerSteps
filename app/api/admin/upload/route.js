import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'blogs');

function safeExt(filename, mimeType) {
  const fromName = path.extname(filename || '').toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fromName)) return fromName;
  const byMime = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
  return byMime[mimeType] || '.jpg';
}

/**
 * POST /api/admin/upload — multipart/form-data with a single `file` field.
 * Local-disk image upload (no cloud storage provider is configured for
 * this project yet) — files land in /public/uploads/blogs and are served
 * directly by Next.js as static assets. Swap this route's internals for an
 * S3/Cloudinary/etc. call later without touching any caller — the response
 * shape (`{ url }`) stays the same.
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

  return ok({ url: `/uploads/blogs/${filename}` }, 201);
});
