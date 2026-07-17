import { canAccess } from '@/lib/access/canAccess';

/**
 * Sprint 19.2 — bridges lib/publicCourses.js's plain DB fetches to
 * lib/access/canAccess.js's actor-aware authorization, without either one
 * knowing about the other's concerns. Lesson *metadata* (title,
 * description, lessonType, estimatedDuration, displayOrder, accessLevel,
 * previewAvailable) is always visible, so the public course page can show
 * a full curriculum outline even for content the visitor can't open yet.
 * Actual content fields (video/pdf/image/externalUrl/body/attachments) are
 * stripped entirely — not just hidden client-side — when access is denied,
 * so a gated lesson's private storage key is never shipped to a browser
 * that shouldn't have it (defense in depth on top of
 * app/api/lessons/[id]/media/route.js's own independent check).
 *
 * PURCHASED-level checks always resolve against the *course* id, even for
 * a lesson-level gate — a visitor buys a course, not an individual lesson
 * (see docs/13_DECISIONS.md) — so `resourceType`/`resourceId` here are
 * always the course's, never the lesson's own id.
 */
export function annotateLessonAccess(lesson, actor) {
  // previewAvailable is the strongest override — it bypasses every access
  // level, including OTP (a "free preview" lesson must be watchable
  // without an OTP round-trip, or the "free" part is a lie). Otherwise,
  // defer to canAccess() as-is — including its admin-override — so an
  // admin previewing a course in the admin panel can see OTP-gated lesson
  // content too, without verifying against themselves (the OTP *media*
  // route, app/api/lessons/[id]/media/route.js, independently honors this
  // same admin bypass — see its own comment).
  const allowed =
    lesson.previewAvailable ||
    canAccess(
      { accessLevel: lesson.accessLevel, resourceType: 'course', resourceId: lesson.course },
      actor
    ).allowed;

  const { video, pdf, image, externalUrl, body, attachments, ...meta } = lesson;

  return {
    ...meta,
    locked: !allowed,
    // Still locked and OTP-gated (and not a free preview) — the page
    // signals "verify to unlock." The actual content is fetched only after
    // POST /api/verify/verify-otp succeeds, via the existing
    // app/api/verify/download route (resourceType 'lesson').
    requiresOtp: lesson.accessLevel === 'OTP' && !allowed,
    ...(allowed ? { video, pdf, image, externalUrl, body, attachments } : {}),
  };
}

/** Applies annotateLessonAccess() to every lesson in every section of a course (from getCourseBySlug()). */
export function annotateCourseAccess(course, actor) {
  if (!course) return course;
  return {
    ...course,
    sections: (course.sections || []).map((section) => ({
      ...section,
      lessons: (section.lessons || []).map((lesson) => annotateLessonAccess(lesson, actor)),
    })),
  };
}
