import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Section from '@/models/Section';
import Lesson from '@/models/Lesson';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { LESSON_TYPE_VALUES } from '@/lib/courseOptions';
import { isValidAccessLevel } from '@/lib/access/accessLevels';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/** GET /api/admin/courses/:id/sections/:sectionId/lessons — every lesson in one section, ordered. */
export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.sectionId)) return fail('Invalid id', 400);

  await connectDB();
  const lessons = await Lesson.find({ section: params.sectionId, course: params.id })
    .sort({ displayOrder: 1 })
    .lean();

  return ok({ lessons });
});

/**
 * POST /api/admin/courses/:id/sections/:sectionId/lessons
 * Body: title (required). Media fields (video/pdf/image/attachments) are
 * set afterward via PUT once uploaded through .../lessons/:lessonId/upload
 * — same two-step "create the doc, then attach media" flow every other
 * upload-bearing module in this codebase already uses.
 */
export const POST = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.sectionId)) return fail('Invalid id', 400);

  await connectDB();
  const section = await Section.exists({ _id: params.sectionId, course: params.id });
  if (!section) return fail('Section not found', 404);

  const body = await request.json();
  if (!body?.title?.trim()) return fail('Lesson title is required', 400);

  const lesson = await Lesson.create({
    section: params.sectionId,
    course: params.id,
    title: body.title,
    description: body.description || '',
    displayOrder: Number.isFinite(body.displayOrder) ? body.displayOrder : 0,
    lessonType: LESSON_TYPE_VALUES.includes(body.lessonType) ? body.lessonType : 'text',
    estimatedDuration: Math.max(0, Number(body.estimatedDuration) || 0),
    previewAvailable: Boolean(body.previewAvailable),
    accessLevel: isValidAccessLevel(body.accessLevel) ? body.accessLevel : 'PUBLIC',
    externalUrl: body.externalUrl || '',
    body: body.body || '',
  });

  return ok({ lesson }, 201);
});
