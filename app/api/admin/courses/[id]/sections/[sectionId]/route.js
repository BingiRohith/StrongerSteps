import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Section from '@/models/Section';
import Lesson from '@/models/Lesson';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * PUT /api/admin/courses/:id/sections/:sectionId — partial update. Also
 * used by the admin curriculum manager's reorder controls to swap
 * `displayOrder` between two adjacent sections within the same course.
 */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.sectionId)) return fail('Invalid id', 400);

  await connectDB();
  const section = await Section.findOne({ _id: params.sectionId, course: params.id });
  if (!section) return fail('Section not found', 404);

  const body = await request.json();

  if (body.title !== undefined) {
    if (!body.title.trim()) return fail('Section title is required', 400);
    section.title = body.title;
  }
  if (body.description !== undefined) section.description = body.description;
  if (body.displayOrder !== undefined) {
    section.displayOrder = Number.isFinite(body.displayOrder) ? body.displayOrder : 0;
  }
  if (body.collapsedByDefault !== undefined) section.collapsedByDefault = Boolean(body.collapsedByDefault);

  await section.save();

  return ok({ section });
});

/**
 * DELETE /api/admin/courses/:id/sections/:sectionId — cascade-deletes its
 * Lessons, same reasoning as Course delete cascading to Section/Lesson
 * (see app/api/admin/courses/[id]/route.js).
 */
export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.sectionId)) return fail('Invalid id', 400);

  await connectDB();
  const section = await Section.findOneAndDelete({ _id: params.sectionId, course: params.id });
  if (!section) return fail('Section not found', 404);

  await Lesson.deleteMany({ section: params.sectionId });

  return ok({ deleted: true });
});
