import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';
import { fail } from '@/lib/apiResponse';

/**
 * Storage for files that must never be reachable via a public static URL —
 * introduced in Sprint 12.5 for Knowledge Center downloads gated by OTP
 * verification (Infographic `pdf`/`fullImage`). Writes to `private-uploads/`
 * at the project root, a sibling of `public/` that Next.js never serves
 * statically. Mirrors lib/localUpload.js's validate-then-write shape, but
 * returns `{ url: filename }` where `url` is a private storage key (resolved
 * only by app/api/verify/download and the infographic preview-image route),
 * never a browsable path.
 */
const PRIVATE_ROOT = path.join(process.cwd(), 'private-uploads');

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const EXT_BY_IMAGE_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

function safeImageExt(filename, mimeType) {
  const fromName = path.extname(filename || '').toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fromName)) return fromName;
  return EXT_BY_IMAGE_MIME[mimeType] || '.jpg';
}

export async function saveProtectedImage(request, subdir, { maxSizeBytes = 8 * 1024 * 1024 } = {}) {
  return saveProtectedFile(request, subdir, {
    maxSizeBytes,
    allowedTypes: ALLOWED_IMAGE_TYPES,
    typeErrorMessage: 'Only JPEG, PNG, WebP, or GIF images are allowed',
    extFor: safeImageExt,
  });
}

export async function saveProtectedPdf(request, subdir, { maxSizeBytes = 15 * 1024 * 1024 } = {}) {
  return saveProtectedFile(request, subdir, {
    maxSizeBytes,
    allowedTypes: new Set(['application/pdf']),
    typeErrorMessage: 'Only PDF files are allowed',
    extFor: () => '.pdf',
  });
}

async function saveProtectedFile(request, subdir, { maxSizeBytes, allowedTypes, typeErrorMessage, extFor }) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return { error: fail('No file uploaded', 400) };
  }
  if (!allowedTypes.has(file.type)) {
    return { error: fail(typeErrorMessage, 400) };
  }
  if (file.size > maxSizeBytes) {
    return { error: fail(`File must be smaller than ${Math.round(maxSizeBytes / (1024 * 1024))}MB`, 400) };
  }

  const dir = path.join(PRIVATE_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const ext = extFor(file.name, file.type);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return { url: filename, filename: file.name || filename };
}

/** Reads a previously-saved protected file's bytes for streaming by a route handler. */
export async function readProtectedFile(subdir, filename) {
  return readFile(path.join(PRIVATE_ROOT, subdir, filename));
}

export function protectedFilePath(subdir, filename) {
  return path.join(PRIVATE_ROOT, subdir, filename);
}
