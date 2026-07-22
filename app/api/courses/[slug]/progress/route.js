import connectDB from '@/lib/db';
import Course from '@/models/Course';
import CourseProgress from '@/models/CourseProgress';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { getCurrentLead } from '@/lib/access/leadSession';

export const dynamic = 'force-dynamic';

/**
 * GET /api/courses/[slug]/progress — public. Returns `{ progress: null }`
 * (200, not an error) for a visitor with no VerifiedLead session — an
 * anonymous visitor simply sees no resume/completion UI, per the Sprint
 * 19.5 decision that progress tracking never blocks browsing.
 */
export const GET = withErrorHandling(async (request, { params }) => {
  await connectDB();

  const lead = await getCurrentLead(request);
  if (!lead) return ok({ progress: null });

  const course = await Course.findOne({ slug: params.slug }).select('_id').lean();
  if (!course) return fail('Course not found', 404);

  const progress = await CourseProgress.findOne({ lead: lead._id, course: course._id }).lean();
  if (!progress) return ok({ progress: null });

  return ok({
    progress: {
      id: progress._id.toString(),
      completedLessons: progress.completedLessons.map((c) => String(c.lesson)),
      currentLesson: progress.currentLesson ? String(progress.currentLesson) : null,
      completionPercent: progress.completionPercent,
      lastViewedAt: progress.lastViewedAt,
      completedAt: progress.completedAt,
    },
  });
});
