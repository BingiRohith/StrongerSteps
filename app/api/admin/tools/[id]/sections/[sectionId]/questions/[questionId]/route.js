import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import ToolQuestion from '@/models/ToolQuestion';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { QUESTION_TYPE_VALUES } from '@/lib/toolOptions';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function scopedQuery(params) {
  return { _id: params.questionId, section: params.sectionId, tool: params.id };
}

function sanitizeOptions(options) {
  if (!Array.isArray(options)) return [];
  return options.map((o) => ({
    label: o?.label || '',
    value: o?.value || '',
    score: Number(o?.score) || 0,
  }));
}

function sanitizeNumericConfig(config) {
  const scoreBands = Array.isArray(config?.scoreBands)
    ? config.scoreBands.map((b) => ({
        min: Number(b?.min) || 0,
        max: Number(b?.max) || 0,
        score: Number(b?.score) || 0,
      }))
    : [];
  return {
    min: Number(config?.min) || 0,
    max: Number(config?.max) || 0,
    step: Number(config?.step) || 1,
    unit: config?.unit || '',
    scoreBands,
  };
}

export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.sectionId) || !isValidId(params.questionId)) {
    return fail('Invalid id', 400);
  }

  await connectDB();
  const question = await ToolQuestion.findOne(scopedQuery(params));
  if (!question) return fail('Question not found', 404);

  return ok({ question });
});

/**
 * PUT /api/admin/tools/:id/sections/:sectionId/questions/:questionId —
 * partial update, including the reorder controls' `displayOrder` swap
 * within the same section.
 */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.sectionId) || !isValidId(params.questionId)) {
    return fail('Invalid id', 400);
  }

  await connectDB();
  const question = await ToolQuestion.findOne(scopedQuery(params));
  if (!question) return fail('Question not found', 404);

  const body = await request.json();

  if (body.questionText !== undefined) {
    if (!body.questionText.trim()) return fail('Question text is required', 400);
    question.questionText = body.questionText;
  }
  if (body.helpText !== undefined) question.helpText = body.helpText;
  if (body.questionType !== undefined) {
    if (!QUESTION_TYPE_VALUES.includes(body.questionType)) return fail('Invalid question type', 400);
    question.questionType = body.questionType;
  }
  if (body.displayOrder !== undefined) {
    question.displayOrder = Number.isFinite(body.displayOrder) ? body.displayOrder : 0;
  }
  if (body.required !== undefined) question.required = Boolean(body.required);
  if (body.options !== undefined) question.options = sanitizeOptions(body.options);
  if (body.numericConfig !== undefined) question.numericConfig = sanitizeNumericConfig(body.numericConfig);

  await question.save();

  return ok({ question });
});

export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.sectionId) || !isValidId(params.questionId)) {
    return fail('Invalid id', 400);
  }

  await connectDB();
  const question = await ToolQuestion.findOneAndDelete(scopedQuery(params));
  if (!question) return fail('Question not found', 404);

  return ok({ deleted: true });
});
