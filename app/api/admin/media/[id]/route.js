import { unlink } from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Media from '@/models/Media';
import { findMediaUsage } from '@/lib/mediaUsage';
import { requireAuth } from '@/lib/auth';
import { fail, ok, withErrorHandling } from '@/lib/apiResponse';
import { protectedFilePath, readProtectedFile } from '@/lib/privateUpload';
import { mimeFromFilename } from '@/lib/fileMime';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return fail('Invalid media id', 400);
  await connectDB();
  const media = await Media.findById(id).lean();
  if (!media) return fail('Media not found', 404);
  if (new URL(request.url).searchParams.get('content') === '1') {
    if (media.storage === 'public') return Response.redirect(new URL(media.url, request.url));
    try {
      const buffer = await readProtectedFile('media', media.url);
      return new Response(buffer, { headers: { 'Content-Type': media.mimeType || mimeFromFilename(media.url), 'Content-Disposition': `inline; filename="${(media.originalName || media.filename).replace(/"/g, '')}"`, 'Cache-Control': 'private, no-store' } });
    } catch { return fail('File not found', 404); }
  }
  return ok({ usage: await findMediaUsage(media) });
});

export const POST = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return fail('Invalid media id', 400);
  await connectDB();
  const media = await Media.findById(id).lean();
  if (!media) return fail('Media not found', 404);
  if (media.storage === 'public') return fail('Public images are served from their saved URL', 400);
  try {
    const buffer = await readProtectedFile('media', media.url);
    return new Response(buffer, { headers: { 'Content-Type': media.mimeType || mimeFromFilename(media.url), 'Content-Disposition': `inline; filename="${(media.originalName || media.filename).replace(/"/g, '')}"`, 'Cache-Control': 'private, no-store' } });
  } catch { return fail('File not found', 404); }
});

export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin']);
  if (user instanceof Response) return user;
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return fail('Invalid media id', 400);
  await connectDB();
  const media = await Media.findById(id);
  if (!media) return fail('Media not found', 404);
  const usage = await findMediaUsage(media);
  // A final live scan is required at delete time: stale client state must
  // never allow a shared asset to disappear from already-saved content.
  if (usage.length) return fail('This file is still used by content and cannot be deleted', 409, { usage });
  const filePath = media.storage === 'private'
    ? protectedFilePath('media', media.url)
    : path.join(process.cwd(), 'public', media.url.replace(/^\//, ''));
  await unlink(filePath).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
  await media.deleteOne();
  return ok({ deleted: true });
});
