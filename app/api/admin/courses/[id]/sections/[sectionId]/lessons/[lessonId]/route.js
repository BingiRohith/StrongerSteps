import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Lesson from '@/models/Lesson';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { LESSON_TYPE_VALUES } from '@/lib/courseOptions';
import { isValidAccessLevel } from '@/lib/access/accessLevels';
import { isValidVideoUrl } from '@/lib/videoEmbed';
import { sanitizeRichHtml } from '@/lib/sanitizeRichHtml';
import Media from '@/models/Media';

const VIDEO_SOURCE_VALUES = ['upload', 'youtube', 'vimeo', 'external'];

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function scopedQuery(params) {
  return { _id: params.lessonId, section: params.sectionId, course: params.id };
}

async function resolveLibraryMedia(mediaId, compatibleKinds) {
  if (!mongoose.Types.ObjectId.isValid(mediaId)) return { error: 'Invalid Media Library asset' };
  const media = await Media.findOne({ _id: mediaId, storage: 'private', kind: { $in: compatibleKinds } }).lean();
  if (!media) return { error: 'Choose a compatible private Media Library asset' };
  return {
    mediaId: media._id,
    url: media.url,
    filename: media.originalName || media.filename,
  };
}

export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.sectionId) || !isValidId(params.lessonId)) {
    return fail('Invalid id', 400);
  }

  await connectDB();
  const lesson = await Lesson.findOne(scopedQuery(params));
  if (!lesson) return fail('Lesson not found', 404);

  const safeLesson = lesson.toObject();
  safeLesson.body = sanitizeRichHtml(safeLesson.body);
  return ok({ lesson: safeLesson });
});

/**
 * PUT /api/admin/courses/:id/sections/:sectionId/lessons/:lessonId —
 * partial update, including media fields (set after
 * .../lessons/:lessonId/upload returns a storage key) and the reorder
 * controls' `displayOrder` swap within the same section.
 */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.sectionId) || !isValidId(params.lessonId)) {
    return fail('Invalid id', 400);
  }

  await connectDB();
  const lesson = await Lesson.findOne(scopedQuery(params));
  if (!lesson) return fail('Lesson not found', 404);

  const body = await request.json();

  if (body.title !== undefined) {
    if (!body.title.trim()) return fail('Lesson title is required', 400);
    lesson.title = body.title;
  }
  if (body.description !== undefined) lesson.description = body.description;
  if (body.displayOrder !== undefined) {
    lesson.displayOrder = Number.isFinite(body.displayOrder) ? body.displayOrder : 0;
  }
  if (body.lessonType !== undefined) {
    if (!LESSON_TYPE_VALUES.includes(body.lessonType)) return fail('Invalid lesson type', 400);
    lesson.lessonType = body.lessonType;
  }
  if (body.estimatedDuration !== undefined) {
    lesson.estimatedDuration = Math.max(0, Number(body.estimatedDuration) || 0);
  }
  if (body.previewAvailable !== undefined) lesson.previewAvailable = Boolean(body.previewAvailable);
  if (body.accessLevel !== undefined) {
    if (!isValidAccessLevel(body.accessLevel)) return fail('Invalid access level', 400);
    lesson.accessLevel = body.accessLevel;
  }
  if (body.video !== undefined) {
    const source = VIDEO_SOURCE_VALUES.includes(body.video?.source) ? body.video.source : 'upload';
    let url = body.video?.url || '';
    let filename = body.video?.filename || '';
    let mediaId = null;
    // 'upload' urls are private storage keys written by the upload route,
    // not visitor-facing URLs — only youtube/vimeo/external need the
    // http(s)-URL-shape check here.
    if (source !== 'upload' && url && !isValidVideoUrl(url)) {
      return fail('Enter a valid YouTube, Vimeo, or direct video URL', 400);
    }
    if (source !== 'upload' && body.video?.mediaId) {
      return fail('Media Library videos must use the uploaded-file source', 400);
    }
    if (source === 'upload' && body.video?.mediaId) {
      const media = await resolveLibraryMedia(body.video.mediaId, ['video']);
      if (media.error) return fail(media.error, 400);
      ({ url, filename, mediaId } = media);
    }
    lesson.video = {
      source,
      url,
      filename,
      mediaId,
      captions: Array.isArray(body.video?.captions) ? body.video.captions : lesson.video?.captions || [],
    };
  }
  if (body.pdf !== undefined) {
    let url = body.pdf?.url || '';
    let filename = body.pdf?.filename || '';
    let mediaId = null;
    if (body.pdf?.mediaId) {
      const media = await resolveLibraryMedia(body.pdf.mediaId, ['pdf']);
      if (media.error) return fail(media.error, 400);
      ({ url, filename, mediaId } = media);
    }
    lesson.pdf = { url, filename, mediaId };
  }
  if (body.image !== undefined) {
    lesson.image = { url: body.image?.url || '', alt: body.image?.alt || '' };
  }
  if (body.externalUrl !== undefined) lesson.externalUrl = body.externalUrl;
  if (body.body !== undefined) lesson.body = sanitizeRichHtml(body.body);
  if (body.attachments !== undefined) {
    if (!Array.isArray(body.attachments)) return fail('Attachments must be an array', 400);
    const attachments = await Promise.all(body.attachments.map(async (attachment) => {
      if (!attachment?.mediaId) {
        return { url: attachment?.url || '', filename: attachment?.filename || '', label: attachment?.label || '', mediaId: null };
      }
      const media = await resolveLibraryMedia(attachment.mediaId, ['pdf', 'document', 'video']);
      if (media.error) return media;
      return { ...media, label: attachment.label || media.filename };
    }));
    const invalidAttachment = attachments.find((attachment) => attachment.error);
    if (invalidAttachment) return fail(invalidAttachment.error, 400);
    lesson.attachments = attachments;
  }
  if (body.bodyImages !== undefined) {
    lesson.bodyImages = Array.isArray(body.bodyImages) ? body.bodyImages : [];
  }

  await lesson.save();

  return ok({ lesson });
});

export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.sectionId) || !isValidId(params.lessonId)) {
    return fail('Invalid id', 400);
  }

  await connectDB();
  const lesson = await Lesson.findOneAndDelete(scopedQuery(params));
  if (!lesson) return fail('Lesson not found', 404);

  return ok({ deleted: true });
});
