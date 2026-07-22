import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Lesson from '@/models/Lesson';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import {
  saveProtectedImage,
  saveProtectedPdf,
  saveProtectedVideo,
  saveProtectedAttachment,
} from '@/lib/privateUpload';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/courses/:id/sections/:sectionId/lessons/:lessonId/upload?mediaType=video|pdf|image|attachment|bodyImage
 *
 * multipart/form-data: `file` only — `mediaType` is a query param, not a
 * form field, so the request body is read exactly once (each
 * saveProtected* helper below calls `request.formData()` itself; reading
 * it twice would throw on the second call). Always writes to private
 * storage (private-uploads/lessons-<type>/) regardless of the lesson's
 * current accessLevel — see models/Lesson.js's header comment for why (an
 * accessLevel can change after upload; a public static path can't be
 * un-published later). Returns `{ url, filename }`, a private storage key
 * — the admin form is responsible for PUT-ing it onto the lesson's
 * matching field (or appending to `attachments`) afterward.
 */
export const POST = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (
    !mongoose.Types.ObjectId.isValid(params.id) ||
    !mongoose.Types.ObjectId.isValid(params.sectionId) ||
    !mongoose.Types.ObjectId.isValid(params.lessonId)
  ) {
    return fail('Invalid id', 400);
  }

  await connectDB();
  const lessonExists = await Lesson.exists({
    _id: params.lessonId,
    section: params.sectionId,
    course: params.id,
  });
  if (!lessonExists) return fail('Lesson not found', 404);

  const { searchParams } = new URL(request.url);
  const mediaType = searchParams.get('mediaType');

  // Route to the right validator/subdir by declared media type. `image`
  // (the lesson's single hero image) and `bodyImage` (inline images inserted
  // into the rich text `body`, Sprint 19.5) both use saveProtectedImage but
  // write to separate subdirs since they're unrelated fields
  // (`Lesson.image` vs `Lesson.bodyImages`). `attachment` accepts any of
  // image/PDF/document/ZIP (lib/privateUpload.js's saveProtectedAttachment)
  // since the brief lists all four as valid attachment types.
  let result;
  if (mediaType === 'video') {
    result = await saveProtectedVideo(request, 'lessons-videos');
  } else if (mediaType === 'pdf') {
    result = await saveProtectedPdf(request, 'lessons-pdfs');
  } else if (mediaType === 'image') {
    result = await saveProtectedImage(request, 'lessons-images');
  } else if (mediaType === 'bodyImage') {
    result = await saveProtectedImage(request, 'lessons-body-images');
  } else if (mediaType === 'attachment') {
    result = await saveProtectedAttachment(request, 'lessons-attachments');
  } else {
    return fail("mediaType must be 'video', 'pdf', 'image', 'bodyImage', or 'attachment'", 400);
  }

  if (result.error) return result.error;

  return ok({ url: result.url, filename: result.filename }, 201);
});
