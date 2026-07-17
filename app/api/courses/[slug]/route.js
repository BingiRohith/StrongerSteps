import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { getCourseBySlug } from '@/lib/publicCourses';
import { getCurrentActor } from '@/lib/access/actor';
import { annotateCourseAccess } from '@/lib/courseAccess';

export const dynamic = 'force-dynamic';

/**
 * GET /api/courses/[slug] — public. Published-only. Returns the full
 * course with its curriculum (sections + lessons); each lesson's actual
 * content fields are stripped unless the current actor can access it (see
 * lib/courseAccess.js) — the curriculum outline itself is always visible.
 */
export const GET = withErrorHandling(async (request, { params }) => {
  const course = await getCourseBySlug(params.slug);
  if (!course) return fail('Course not found', 404);

  const actor = await getCurrentActor(request);

  return ok({ course: annotateCourseAccess(course, actor) });
});
