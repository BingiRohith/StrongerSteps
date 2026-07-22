import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Lesson from '@/models/Lesson';
import Course from '@/models/Course';
import CourseProgress from '@/models/CourseProgress';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { getCurrentLead } from '@/lib/access/leadSession';

export const dynamic = 'force-dynamic';

const VALID_ACTIONS = ['view', 'complete', 'incomplete'];

/**
 * POST /api/lessons/[id]/progress — public, but requires a VerifiedLead.
 * Body: { action: 'view' | 'complete' | 'incomplete' }.
 *
 * Per the confirmed Sprint 19.5 decision, progress is only ever persisted
 * for a verified visitor (lib/access/leadSession.js's getCurrentLead()) —
 * an unverified visitor can freely watch any PUBLIC lesson, but nothing is
 * saved here until they verify once via the existing OTP flow
 * (app/api/verify/generate-otp + verify-otp, resourceType 'lesson', the same
 * flow components/courses/LessonOtpUnlock.js already implements). Returns
 * 401 { error: 'verify-required' } so the client can show that same
 * component instead of failing silently.
 *
 * `completionPercent` is always computed here from the course's current
 * lesson count — never accepted from the request body.
 */
export const POST = withErrorHandling(async (request, { params }) => {
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return fail('Invalid lesson id', 400);
  }

  const body = await request.json();
  const action = body?.action;
  if (!VALID_ACTIONS.includes(action)) {
    return fail("action must be 'view', 'complete', or 'incomplete'", 400);
  }

  await connectDB();

  const lesson = await Lesson.findById(params.id).select('course').lean();
  if (!lesson) return fail('Lesson not found', 404);

  const lead = await getCurrentLead(request);
  if (!lead) {
    return fail('Verify your email or mobile to save your progress', 401, { error: 'verify-required' });
  }

  let progress = await CourseProgress.findOne({ lead: lead._id, course: lesson.course });
  if (!progress) {
    progress = new CourseProgress({ lead: lead._id, course: lesson.course });
  }

  if (action === 'view') {
    progress.currentLesson = lesson._id;
    progress.lastViewedAt = new Date();
  } else if (action === 'complete') {
    const alreadyDone = progress.completedLessons.some((c) => String(c.lesson) === String(lesson._id));
    if (!alreadyDone) {
      progress.completedLessons.push({ lesson: lesson._id, completedAt: new Date() });
    }
    progress.currentLesson = lesson._id;
    progress.lastViewedAt = new Date();
  } else if (action === 'incomplete') {
    progress.completedLessons = progress.completedLessons.filter(
      (c) => String(c.lesson) !== String(lesson._id)
    );
  }

  const totalLessons = await Lesson.countDocuments({ course: lesson.course });
  progress.completionPercent = totalLessons > 0
    ? Math.round((progress.completedLessons.length / totalLessons) * 100)
    : 0;
  progress.completedAt = progress.completionPercent >= 100 ? (progress.completedAt || new Date()) : null;

  await progress.save();

  return ok({ progress: progress.toSafeObject() });
});
