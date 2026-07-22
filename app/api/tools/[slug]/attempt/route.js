import Tool from '@/models/Tool';
import connectDB from '@/lib/db';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { getToolQuestionsFlat, getToolResultBands } from '@/lib/publicTools';
import { verifyDownloadToken } from '@/lib/verification/verificationService';
import { computeToolScore } from '@/lib/toolScoring';
import { getCurrentActor } from '@/lib/access/actor';
import { canAccess } from '@/lib/access/canAccess';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tools/[slug]/attempt — public. Computes and returns a scored
 * result for a submitted set of assessment answers. Body: { answers:
 * [{questionId, value}], downloadToken? }.
 *
 * Reuses the exact same short-lived OTP token every other OTP-gated
 * resource type uses (verifyDownloadToken(), from
 * lib/verification/verificationService.js) — just consumed by a
 * score-compute route instead of a file stream, since a Tool's OTP gate
 * protects the *result*, not a download (see
 * lib/verification/resourceRegistry.js's `tool` entry). `PUBLIC` tools skip
 * every check below. `MEMBER`/`PURCHASED`/`ADMIN` tools are gated the same
 * way app/api/lessons/[id]/media/route.js gates lesson media — session-based
 * canAccess(), not a token — since there's no separate "preview vs full"
 * split for a Tool the way there is for a file/lesson.
 */
export const POST = withErrorHandling(async (request, { params }) => {
  await connectDB();

  const tool = await Tool.findOne({ slug: params.slug, status: 'published' }).lean();
  if (!tool) return fail('Tool not found', 404);

  const body = await request.json();
  const answers = Array.isArray(body?.answers) ? body.answers : [];

  if (tool.accessLevel === 'OTP') {
    if (!body?.downloadToken) return fail('Verification is required to see your results', 401);

    const verified = verifyDownloadToken(body.downloadToken);
    if (!verified.ok) return fail(verified.error, verified.status);
    if (
      verified.payload.resourceType !== 'tool' ||
      verified.payload.resourceId !== String(tool._id)
    ) {
      return fail('This verification does not match this tool', 401);
    }
  } else if (tool.accessLevel !== 'PUBLIC') {
    const actor = await getCurrentActor(request);
    const allowed = canAccess(
      { accessLevel: tool.accessLevel, resourceType: 'tool', resourceId: tool._id },
      actor
    ).allowed;
    if (!allowed) return fail('You do not have access to this tool', 403);
  }

  const [questions, resultBands] = await Promise.all([
    getToolQuestionsFlat(tool._id),
    getToolResultBands(tool._id),
  ]);

  const { totalScore, band } = computeToolScore({ questions, answers, resultBands });

  return ok({ totalScore, band });
});
