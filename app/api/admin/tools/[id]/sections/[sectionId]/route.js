import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import ToolSection from '@/models/ToolSection';
import ToolQuestion from '@/models/ToolQuestion';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * PUT /api/admin/tools/:id/sections/:sectionId — partial update. Also used
 * by the admin builder's reorder controls to swap `displayOrder` between
 * two adjacent sections within the same tool.
 */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.sectionId)) return fail('Invalid id', 400);

  await connectDB();
  const section = await ToolSection.findOne({ _id: params.sectionId, tool: params.id });
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

  await section.save();

  return ok({ section });
});

/**
 * DELETE /api/admin/tools/:id/sections/:sectionId — cascade-deletes its
 * Questions, same reasoning as Tool delete cascading to Section/Question
 * (see app/api/admin/tools/[id]/route.js).
 */
export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.sectionId)) return fail('Invalid id', 400);

  await connectDB();
  const section = await ToolSection.findOneAndDelete({ _id: params.sectionId, tool: params.id });
  if (!section) return fail('Section not found', 404);

  await ToolQuestion.deleteMany({ section: params.sectionId });

  return ok({ deleted: true });
});
