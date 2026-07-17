import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import Section from '@/models/Section';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/courses/:id/sections — every section for one course,
 * ordered for the admin curriculum manager. No pagination — a course's
 * section count stays small, same convention as every other admin list in
 * this codebase.
 */
export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid course id', 400);

  await connectDB();
  const sections = await Section.find({ course: params.id }).sort({ displayOrder: 1 }).lean();

  return ok({ sections });
});

/**
 * POST /api/admin/courses/:id/sections
 * Body: title (required), description?, displayOrder?, collapsedByDefault?
 */
export const POST = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid course id', 400);

  await connectDB();
  const course = await Course.exists({ _id: params.id });
  if (!course) return fail('Course not found', 404);

  const body = await request.json();
  if (!body?.title?.trim()) return fail('Section title is required', 400);

  const section = await Section.create({
    course: params.id,
    title: body.title,
    description: body.description || '',
    displayOrder: Number.isFinite(body.displayOrder) ? body.displayOrder : 0,
    collapsedByDefault: Boolean(body.collapsedByDefault),
  });

  return ok({ section }, 201);
});
