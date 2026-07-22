import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import ToolResultBand from '@/models/ToolResultBand';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function scopedQuery(params) {
  return { _id: params.bandId, tool: params.id };
}

/** PUT /api/admin/tools/:id/result-bands/:bandId — partial update. */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.bandId)) return fail('Invalid id', 400);

  await connectDB();
  const resultBand = await ToolResultBand.findOne(scopedQuery(params));
  if (!resultBand) return fail('Result band not found', 404);

  const body = await request.json();

  if (body.minScore !== undefined) {
    if (!Number.isFinite(Number(body.minScore))) return fail('Invalid minimum score', 400);
    resultBand.minScore = Number(body.minScore);
  }
  if (body.maxScore !== undefined) {
    if (!Number.isFinite(Number(body.maxScore))) return fail('Invalid maximum score', 400);
    resultBand.maxScore = Number(body.maxScore);
  }
  if (body.label !== undefined) {
    if (!body.label.trim()) return fail('Label is required', 400);
    resultBand.label = body.label;
  }
  if (body.description !== undefined) resultBand.description = body.description;
  if (body.recommendations !== undefined) {
    resultBand.recommendations = Array.isArray(body.recommendations) ? body.recommendations : [];
  }
  if (body.displayOrder !== undefined) {
    resultBand.displayOrder = Number.isFinite(body.displayOrder) ? body.displayOrder : 0;
  }

  await resultBand.save();

  return ok({ resultBand });
});

export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.bandId)) return fail('Invalid id', 400);

  await connectDB();
  const resultBand = await ToolResultBand.findOneAndDelete(scopedQuery(params));
  if (!resultBand) return fail('Result band not found', 404);

  return ok({ deleted: true });
});
