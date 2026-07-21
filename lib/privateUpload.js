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

const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/ogg']);
const EXT_BY_VIDEO_MIME = { 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/ogg': '.ogv' };

/**
 * Sprint 19.2 — lesson videos. Buffers the whole upload in memory before
 * writing, same as every other upload route in this codebase (no
 * chunked/streaming upload exists anywhere yet) — acceptable for the
 * current local-disk, single-instance deployment, but a real limitation
 * for large video files; flagged alongside the existing local-disk-storage
 * caveat in docs/09_DEPLOYMENT.md as something a future cloud-storage
 * migration should also address with resumable/chunked uploads.
 */
export async function saveProtectedVideo(request, subdir, { maxSizeBytes = 200 * 1024 * 1024 } = {}) {
  return saveProtectedFile(request, subdir, {
    maxSizeBytes,
    allowedTypes: ALLOWED_VIDEO_TYPES,
    typeErrorMessage: 'Only MP4, WebM, or Ogg video files are allowed',
    extFor: (filename, mimeType) => {
      const fromName = path.extname(filename || '').toLowerCase();
      if (['.mp4', '.webm', '.ogv', '.ogg'].includes(fromName)) return fromName;
      return EXT_BY_VIDEO_MIME[mimeType] || '.mp4';
    },
  });
}

const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);
const EXT_BY_DOCUMENT_MIME = {
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
};

/**
 * Sprint 19.2 — lesson "Downloadable Resources"/"Attachments" (one field,
 * `Lesson.attachments` — see models/Lesson.js) when the file is an office
 * document. An attachment that's actually an image or PDF should go
 * through `saveProtectedImage()`/`saveProtectedPdf()` above instead — this
 * function only covers doc/docx/ppt/pptx/xls/xlsx, so the upload route
 * choosing between these three savers by mimetype never needs a fourth,
 * catch-all "any file type" uploader (do NOT add one — an unbounded
 * allowlist defeats the purpose of validating uploads at all).
 */
export async function saveProtectedDocument(request, subdir, { maxSizeBytes = 20 * 1024 * 1024 } = {}) {
  return saveProtectedFile(request, subdir, {
    maxSizeBytes,
    allowedTypes: ALLOWED_DOCUMENT_TYPES,
    typeErrorMessage: 'Only Word, PowerPoint, or Excel documents are allowed',
    extFor: (filename, mimeType) => {
      const fromName = path.extname(filename || '').toLowerCase();
      if (Object.values(EXT_BY_DOCUMENT_MIME).includes(fromName)) return fromName;
      return EXT_BY_DOCUMENT_MIME[mimeType] || '.docx';
    },
  });
}

const ALLOWED_ZIP_TYPES = new Set(['application/zip', 'application/x-zip-compressed']);

/** Sprint 19.3 — Resource Library "ZIP Archive" file type. Same saveProtectedFile() core as every other saver above. */
export async function saveProtectedZip(request, subdir, { maxSizeBytes = 100 * 1024 * 1024 } = {}) {
  return saveProtectedFile(request, subdir, {
    maxSizeBytes,
    allowedTypes: ALLOWED_ZIP_TYPES,
    typeErrorMessage: 'Only ZIP archives are allowed',
    extFor: () => '.zip',
  });
}

const ALLOWED_AUDIO_TYPES = new Set(['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-wav']);
const EXT_BY_AUDIO_MIME = { 'audio/mpeg': '.mp3', 'audio/wav': '.wav', 'audio/x-wav': '.wav', 'audio/mp4': '.m4a' };

/** Sprint 19.3 — Resource Library "Audio" file type. Same saveProtectedFile() core as every other saver above. */
export async function saveProtectedAudio(request, subdir, { maxSizeBytes = 50 * 1024 * 1024 } = {}) {
  return saveProtectedFile(request, subdir, {
    maxSizeBytes,
    allowedTypes: ALLOWED_AUDIO_TYPES,
    typeErrorMessage: 'Only MP3, WAV, or M4A audio files are allowed',
    extFor: (filename, mimeType) => {
      const fromName = path.extname(filename || '').toLowerCase();
      if (['.mp3', '.wav', '.m4a'].includes(fromName)) return fromName;
      return EXT_BY_AUDIO_MIME[mimeType] || '.mp3';
    },
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

  // Sprint 19.3 — mimeType/sizeBytes are additive: existing callers
  // (e.g. Lesson's upload route) destructure {url, filename} and simply
  // ignore the two new keys. Kept so a future cloud-storage migration has
  // provider-agnostic metadata already captured at upload time instead of
  // re-derived from the stored filename's extension later.
  return { url: filename, filename: file.name || filename, mimeType: file.type, sizeBytes: file.size };
}

/** Reads a previously-saved protected file's bytes for streaming by a route handler. */
export async function readProtectedFile(subdir, filename) {
  return readFile(path.join(PRIVATE_ROOT, subdir, filename));
}

export function protectedFilePath(subdir, filename) {
  return path.join(PRIVATE_ROOT, subdir, filename);
}
