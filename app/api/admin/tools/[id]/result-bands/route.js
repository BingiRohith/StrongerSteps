import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Tool from '@/models/Tool';
import ToolResultBand from '@/models/ToolResultBand';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/tools/:id/result-bands — every score-range/label/
 * recommendation band for one tool, ordered for the admin scoring manager.
 */
export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid tool id', 400);

  await connectDB();
  const resultBands = await ToolResultBand.find({ tool: params.id })
    .sort({ displayOrder: 1, minScore: 1 })
    .lean();

  return ok({ resultBands });
});

/**
 * POST /api/admin/tools/:id/result-bands
 * Body: minScore, maxScore, label (required), description?,
 * recommendations?, displayOrder?
 */
export const POST = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid tool id', 400);

  await connectDB();
  const tool = await Tool.exists({ _id: params.id });
  if (!tool) return fail('Tool not found', 404);

  const body = await request.json();
  if (!body?.label?.trim()) return fail('Label is required', 400);
  if (!Number.isFinite(Number(body.minScore)) || !Number.isFinite(Number(body.maxScore))) {
    return fail('Minimum and maximum score are required', 400);
  }

  const resultBand = await ToolResultBand.create({
    tool: params.id,
    minScore: Number(body.minScore),
    maxScore: Number(body.maxScore),
    label: body.label,
    description: body.description || '',
    recommendations: Array.isArray(body.recommendations) ? body.recommendations : [],
    displayOrder: Number.isFinite(body.displayOrder) ? body.displayOrder : 0,
  });

  return ok({ resultBand }, 201);
});
