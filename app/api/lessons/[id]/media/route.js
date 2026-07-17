import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Lesson from '@/models/Lesson';
import Course from '@/models/Course';
import { fail, withErrorHandling } from '@/lib/apiResponse';
import { getCurrentActor } from '@/lib/access/actor';
import { canAccess } from '@/lib/access/canAccess';
import { getResourceConfig } from '@/lib/verification/resourceRegistry';
import { readProtectedFile } from '@/lib/privateUpload';
import { mimeFromFilename } from '@/lib/fileMime';

export const dynamic = 'force-dynamic';

/**
 * GET /api/lessons/[id]/media?fileKind=video|pdf|image|attachment-<index>
 *
 * Sprint 19.2 — the streaming route for lesson media gated by
 * MEMBER/PURCHASED/ADMIN/PUBLIC access levels (session-based, via
 * lib/access/canAccess.js). For non-admins, lessons with
 * `accessLevel: 'OTP'` are NOT served here — they go through the existing,
 * unchanged app/api/verify/* flow instead (a `lesson` entry is registered
 * in lib/verification/resourceRegistry.js for that purpose). An admin
 * session is let through regardless — the same admin-preview override
 * canAccess() already applies to every other level (see
 * docs/14_ACCESS_CONTROL.md) would otherwise be inconsistently withheld
 * just for OTP, and an admin previewing their own course shouldn't need to
 * OTP-verify against themselves. Reuses the registry's `getFile`/
 * `subdirFor` for file resolution, but not its `isAccessible` (which is
 * specifically "is this lesson OTP-eligible for a non-admin visitor", the
 * opposite question this route asks).
 */
export const GET = withErrorHandling(async (request, { params }) => {
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return fail('Invalid lesson id', 400);
  }

  const { searchParams } = new URL(request.url);
  const fileKind = searchParams.get('fileKind') || 'video';

  await connectDB();

  const lesson = await Lesson.findById(params.id);
  if (!lesson) return fail('Lesson not found', 404);

  const course = await Course.findById(lesson.course).select('status').lean();
  const actor = await getCurrentActor(request);

  if (lesson.accessLevel === 'OTP' && !actor.user) {
    return fail('This lesson requires OTP verification — use /api/verify/generate-otp', 400);
  }

  // Don't leak the existence of a draft course's lesson to a non-admin,
  // even if the lesson happens to be a free preview.
  if (course?.status !== 'published' && !actor.user) {
    return fail('Lesson not found', 404);
  }

  const allowed =
    lesson.previewAvailable ||
    canAccess(
      { accessLevel: lesson.accessLevel, resourceType: 'course', resourceId: lesson.course },
      actor
    ).allowed;

  if (!allowed) {
    return fail('You do not have access to this lesson', 403);
  }

  const config = getResourceConfig('lesson');
  const file = config.getFile(lesson, fileKind);
  if (!file?.url) {
    return fail('Media not available for this lesson', 404);
  }

  const subdir = config.subdirFor(fileKind);
  let buffer;
  try {
    buffer = await readProtectedFile(subdir, file.url);
  } catch (err) {
    return fail('File not found', 404);
  }

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': mimeFromFilename(file.url),
      'Content-Disposition': `inline; filename="${(file.filename || file.url).replace(/"/g, '')}"`,
      'Cache-Control': 'private, no-store',
    },
  });
});
