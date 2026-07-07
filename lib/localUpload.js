import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fail } from '@/lib/apiResponse';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const EXT_BY_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

function safeImageExt(filename, mimeType) {
  const fromName = path.extname(filename || '').toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fromName)) return fromName;
  return EXT_BY_MIME[mimeType] || '.jpg';
}

/**
 * Validates and saves an uploaded image from a multipart/form-data request
 * to public/uploads/<subdir>/, returning its public URL. Factors out the
 * local-disk upload pattern that app/api/admin/upload, .../infographics/upload,
 * and .../team/upload each already duplicate independently — new upload
 * routes (e.g. products) should call this instead of adding another copy.
 * Those three existing routes are left as-is to avoid touching working code.
 */
export async function saveUploadedImage(request, subdir, { maxSizeBytes = 5 * 1024 * 1024 } = {}) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return { error: fail('No file uploaded', 400) };
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { error: fail('Only JPEG, PNG, WebP, or GIF images are allowed', 400) };
  }
  if (file.size > maxSizeBytes) {
    return { error: fail(`Image must be smaller than ${Math.round(maxSizeBytes / (1024 * 1024))}MB`, 400) };
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', subdir);
  await mkdir(uploadDir, { recursive: true });

  const ext = safeImageExt(file.name, file.type);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return { url: `/uploads/${subdir}/${filename}` };
}
