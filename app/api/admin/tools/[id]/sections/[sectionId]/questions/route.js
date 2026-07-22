import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import ToolSection from '@/models/ToolSection';
import ToolQuestion from '@/models/ToolQuestion';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { QUESTION_TYPE_VALUES } from '@/lib/toolOptions';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/** Sanitizes a client-submitted options array into the schema's exact sub-doc shape. */
function sanitizeOptions(options) {
  if (!Array.isArray(options)) return [];
  return options.map((o) => ({
    label: o?.label || '',
    value: o?.value || '',
    score: Number(o?.score) || 0,
  }));
}

/** Sanitizes a client-submitted numericConfig into the schema's exact shape. */
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

/** GET /api/admin/tools/:id/sections/:sectionId/questions — every question in one section, ordered. */
export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.sectionId)) return fail('Invalid id', 400);

  await connectDB();
  const questions = await ToolQuestion.find({ section: params.sectionId, tool: params.id })
    .sort({ displayOrder: 1 })
    .lean();

  return ok({ questions });
});

/**
 * POST /api/admin/tools/:id/sections/:sectionId/questions
 * Body: questionText (required), questionType?, helpText?, displayOrder?,
 * required?, options? (radio/checkbox/yesno), numericConfig? (numeric).
 */
export const POST = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id) || !isValidId(params.sectionId)) return fail('Invalid id', 400);

  await connectDB();
  const section = await ToolSection.exists({ _id: params.sectionId, tool: params.id });
  if (!section) return fail('Section not found', 404);

  const body = await request.json();
  if (!body?.questionText?.trim()) return fail('Question text is required', 400);

  const questionType = QUESTION_TYPE_VALUES.includes(body.questionType) ? body.questionType : 'radio';

  const question = await ToolQuestion.create({
    section: params.sectionId,
    tool: params.id,
    questionText: body.questionText,
    helpText: body.helpText || '',
    questionType,
    displayOrder: Number.isFinite(body.displayOrder) ? body.displayOrder : 0,
    required: body.required !== undefined ? Boolean(body.required) : true,
    options: sanitizeOptions(body.options),
    numericConfig: sanitizeNumericConfig(body.numericConfig),
  });

  return ok({ question }, 201);
});
