import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Lesson from '@/models/Lesson';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import {
  saveProtectedImage,
  saveProtectedPdf,
  saveProtectedVideo,
  saveProtectedDocument,
} from '@/lib/privateUpload';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/courses/:id/sections/:sectionId/lessons/:lessonId/upload?mediaType=video|pdf|image|attachment
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

  // Route to the right validator/subdir by declared media type — a
  // document upload for an "attachment" is validated against office-doc
  // mimetypes only (lib/privateUpload.js's saveProtectedDocument);
  // attachments that are actually images or PDFs should be uploaded with
  // mediaType 'image'/'pdf' instead, reusing those savers directly.
  let result;
  if (mediaType === 'video') {
    result = await saveProtectedVideo(request, 'lessons-videos');
  } else if (mediaType === 'pdf') {
    result = await saveProtectedPdf(request, 'lessons-pdfs');
  } else if (mediaType === 'image') {
    result = await saveProtectedImage(request, 'lessons-images');
  } else if (mediaType === 'attachment') {
    result = await saveProtectedDocument(request, 'lessons-attachments');
  } else {
    return fail("mediaType must be 'video', 'pdf', 'image', or 'attachment'", 400);
  }

  if (result.error) return result.error;

  return ok({ url: result.url, filename: result.filename }, 201);
});
