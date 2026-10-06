import { unlink } from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Media from '@/models/Media';
import { findMediaUsage } from '@/lib/mediaUsage';
import { requireAuth } from '@/lib/auth';
import { fail, ok, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return fail('Invalid media id', 400);
  await connectDB();
  const media = await Media.findById(id).lean();
  if (!media) return fail('Media not found', 404);
  return ok({ usage: await findMediaUsage(media.url) });
});

export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin']);
  if (user instanceof Response) return user;
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return fail('Invalid media id', 400);
  await connectDB();
  const media = await Media.findById(id);
  if (!media) return fail('Media not found', 404);
  const usage = await findMediaUsage(media.url);
  // A final live scan is required at delete time: stale client state must
  // never allow a shared asset to disappear from already-saved content.
  if (usage.length) return fail('This file is still used by content and cannot be deleted', 409, { usage });
  await unlink(path.join(process.cwd(), 'public', media.url.replace(/^\//, ''))).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
  await media.deleteOne();
  return ok({ deleted: true });
});
