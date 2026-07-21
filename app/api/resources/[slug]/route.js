import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { getResourceBySlug } from '@/lib/publicResources';
import { getCurrentActor } from '@/lib/access/actor';
import { annotateResourceAccess } from '@/lib/resourceAccess';

export const dynamic = 'force-dynamic';

/**
 * GET /api/resources/[slug] — public. Published-only. Returns the full
 * resource with its files; each file's actual content fields are stripped
 * unless the current actor can access it (see lib/resourceAccess.js) — the
 * file list outline itself is always visible.
 */
export const GET = withErrorHandling(async (request, { params }) => {
  const resource = await getResourceBySlug(params.slug);
  if (!resource) return fail('Resource not found', 404);

  const actor = await getCurrentActor(request);

  return ok({ resource: annotateResourceAccess(resource, actor) });
});
