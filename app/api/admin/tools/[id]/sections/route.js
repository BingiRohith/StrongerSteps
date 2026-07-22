import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Tool from '@/models/Tool';
import ToolSection from '@/models/ToolSection';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/tools/:id/sections — every section for one tool, ordered
 * for the admin builder. No pagination — mirrors
 * app/api/admin/courses/[id]/sections/route.js.
 */
export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid tool id', 400);

  await connectDB();
  const sections = await ToolSection.find({ tool: params.id }).sort({ displayOrder: 1 }).lean();

  return ok({ sections });
});

/** POST /api/admin/tools/:id/sections — Body: title (required), description?, displayOrder? */
export const POST = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid tool id', 400);

  await connectDB();
  const tool = await Tool.exists({ _id: params.id });
  if (!tool) return fail('Tool not found', 404);

  const body = await request.json();
  if (!body?.title?.trim()) return fail('Section title is required', 400);

  const section = await ToolSection.create({
    tool: params.id,
    title: body.title,
    description: body.description || '',
    displayOrder: Number.isFinite(body.displayOrder) ? body.displayOrder : 0,
  });

  return ok({ section }, 201);
});
