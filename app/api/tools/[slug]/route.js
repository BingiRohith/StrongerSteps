import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { getToolBySlug } from '@/lib/publicTools';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tools/[slug] — public. Published-only. Returns the full tool
 * with its sections/questions (always visible — see lib/publicTools.js's
 * header comment on why this differs from Resources' per-file redaction).
 * No result bands/recommendations here — those are only revealed after
 * scoring via POST /api/tools/[slug]/attempt.
 */
export const GET = withErrorHandling(async (request, { params }) => {
  const tool = await getToolBySlug(params.slug);
  if (!tool) return fail('Tool not found', 404);

  return ok({ tool });
});
