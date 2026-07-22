import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Lock, ExternalLink, FileText, Download, CreditCard, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui';
import CourseCurriculumAccordion from '@/components/courses/CourseCurriculumAccordion';
import LessonOtpUnlock from '@/components/courses/LessonOtpUnlock';
import LessonProgressControls from '@/components/courses/LessonProgressControls';
import { getPublicLessonById, getCourseBySlug } from '@/lib/publicCourses';
import { getCurrentActor } from '@/lib/access/actor';
import { getCurrentLead } from '@/lib/access/leadSession';
import { annotateLessonAccess, annotateCourseAccess } from '@/lib/courseAccess';
import { parseVideoUrl, isDirectVideoFile } from '@/lib/videoEmbed';
import connectDB from '@/lib/db';
import CourseProgress from '@/models/CourseProgress';

export const dynamic = 'force-dynamic';

/** Flattens a course's sections into one ordered lesson-id list for prev/next navigation. */
function flattenLessonIds(sections) {
  return (sections || []).flatMap((s) => (s.lessons || []).map((l) => l._id));
}

export async function generateMetadata({ params }) {
  const result = await getPublicLessonById(params.lessonId);
  if (!result || result.course.slug !== params.slug) return { title: 'Lesson not found' };
  return { title: `${result.lesson.title} · ${result.course.title}` };
}

/**
 * Lesson viewer — renders lesson content according to `lessonType` when
 * the current actor can access it, or an unlock prompt otherwise
 * (OTP-gated lessons get an inline verify flow; MEMBER/PURCHASED-gated
 * lessons get a message pointing at the relevant future flow, since
 * Membership purchase and Payments aren't built yet — see
 * docs/13_DECISIONS.md / this sprint's "Not implemented" list).
 */
export default async function LessonViewerPage({ params }) {
  const result = await getPublicLessonById(params.lessonId);
  if (!result || result.course.slug !== params.slug) notFound();

  const actor = await getCurrentActor();
  const lesson = annotateLessonAccess(result.lesson, actor);
  const course = annotateCourseAccess(await getCourseBySlug(params.slug), actor);

  const orderedLessonIds = flattenLessonIds(course?.sections);
  const currentIndex = orderedLessonIds.indexOf(params.lessonId);
  const prevLessonId = currentIndex > 0 ? orderedLessonIds[currentIndex - 1] : null;
  const nextLessonId = currentIndex >= 0 && currentIndex < orderedLessonIds.length - 1
    ? orderedLessonIds[currentIndex + 1]
    : null;

  // Progress is only ever tracked for a VerifiedLead (Sprint 19.5 decision)
  // — an anonymous visitor sees the page with no progress state at all.
  const lead = await getCurrentLead();
  let progress = null;
  if (lead) {
    await connectDB();
    const doc = await CourseProgress.findOne({ lead: lead._id, course: result.course._id }).lean();
    if (doc) {
      progress = {
        completedLessons: doc.completedLessons.map((c) => String(c.lesson)),
        currentLesson: doc.currentLesson ? String(doc.currentLesson) : null,
      };
    }
  }

  return (
    <section className="bg-bg">
      <div className="mx-auto max-w-content px-6 py-12 md:py-16">
        <Link
          href={`/courses/${params.slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to {result.course.title}
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <h1 className="font-display text-2xl font-bold text-primary-dark md:text-3xl">{lesson.title}</h1>
            {lesson.description && <p className="mt-3 text-base text-muted">{lesson.description}</p>}

            <div className="mt-8">
              {lesson.locked ? (
                <LockedLessonPanel lesson={lesson} />
              ) : (
                <UnlockedLessonContent lesson={lesson} lessonId={params.lessonId} />
              )}
            </div>

            {!lesson.locked && (
              <LessonProgressControls
                lessonId={params.lessonId}
                hasLead={Boolean(lead)}
                initialCompleted={progress?.completedLessons?.includes(params.lessonId) || false}
                prevHref={prevLessonId ? `/courses/${params.slug}/lessons/${prevLessonId}` : null}
                nextHref={nextLessonId ? `/courses/${params.slug}/lessons/${nextLessonId}` : null}
              />
            )}
          </div>

          <aside className="lg:sticky lg:top-8 lg:h-fit">
            <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-primary-dark">
              Course content
            </h2>
            <CourseCurriculumAccordion courseSlug={params.slug} sections={course?.sections} progress={progress} />
          </aside>
        </div>
      </div>
    </section>
  );
}

function LockedLessonPanel({ lesson }) {
  if (lesson.requiresOtp) {
    return <LessonOtpUnlock lessonId={lesson.id} />;
  }

  const isMember = lesson.accessLevel === 'MEMBER';

  return (
    <div className="flex flex-col items-center rounded-xl2 border border-line bg-white px-6 py-12 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
        <Lock size={20} aria-hidden="true" />
      </span>
      <p className="font-display text-base font-semibold text-ink">
        {isMember ? 'This lesson requires membership' : 'This lesson requires purchase'}
      </p>
      <p className="mt-2 max-w-sm text-sm text-muted">
        {isMember
          ? 'Join Stronger Steps membership to unlock this and every member-only lesson.'
          : 'Course purchases aren’t available yet — check back soon.'}
      </p>
      {isMember && (
        <div className="mt-5">
          <Button href="/join" variant="outline" size="sm">
            <CreditCard size={15} aria-hidden="true" />
            View membership plans
          </Button>
        </div>
      )}
      {!isMember && (
        <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
          <ShoppingBag size={14} aria-hidden="true" />
          Course purchases — coming in a future update
        </span>
      )}
    </div>
  );
}

function UnlockedLessonContent({ lesson, lessonId }) {
  const videoSource = lesson.video?.source || 'upload';

  return (
    <div>
      {lesson.lessonType === 'video' && lesson.video?.url && videoSource === 'upload' && (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- caption/subtitle architecture is in place (Lesson.video.captions) but not wired to playback this sprint
        <video controls className="w-full rounded-xl2 bg-ink" src={`/api/lessons/${lessonId}/media?fileKind=video`}>
          Your browser does not support the video tag.
        </video>
      )}

      {lesson.lessonType === 'video' && lesson.video?.url && (videoSource === 'youtube' || videoSource === 'vimeo') && (
        <div className="aspect-video w-full overflow-hidden rounded-xl2 bg-ink">
          <iframe
            src={parseVideoUrl(lesson.video.url).embedUrl}
            title={lesson.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {lesson.lessonType === 'video' && lesson.video?.url && videoSource === 'external' && (
        isDirectVideoFile(lesson.video.url) ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption -- caption/subtitle architecture is in place (Lesson.video.captions) but not wired to playback this sprint
          <video controls className="w-full rounded-xl2 bg-ink" src={lesson.video.url}>
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="aspect-video w-full overflow-hidden rounded-xl2 bg-ink">
            <iframe src={lesson.video.url} title={lesson.title} className="h-full w-full" allowFullScreen />
          </div>
        )
      )}

      {lesson.lessonType === 'pdf' && lesson.pdf?.url && (
        <a
          href={`/api/lessons/${lessonId}/media?fileKind=pdf`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <FileText size={16} aria-hidden="true" />
          Open PDF
        </a>
      )}

      {lesson.lessonType === 'image' && lesson.image?.url && (
        // eslint-disable-next-line @next/next/no-img-element -- gated preview served through the access-controlled media route
        <img
          src={`/api/lessons/${lessonId}/media?fileKind=image`}
          alt={lesson.image.alt || lesson.title}
          className="w-full rounded-xl2 object-cover"
        />
      )}

      {lesson.lessonType === 'external_link' && lesson.externalUrl && (
        <a
          href={lesson.externalUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <ExternalLink size={16} aria-hidden="true" />
          Open link
        </a>
      )}

      {lesson.lessonType === 'text' && lesson.body && (
        // eslint-disable-next-line react/no-danger -- admin-authored HTML from the lesson rich text editor, same trust model as Course.longDescription/Blog.content elsewhere in this app
        <div
          className="prose-editor max-w-none text-base leading-relaxed text-ink [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-line [&_td]:p-2 [&_th]:border [&_th]:border-line [&_th]:bg-sage/40 [&_th]:p-2 [&_pre]:rounded-lg [&_pre]:bg-ink [&_pre]:p-3 [&_pre]:text-white [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-3 [&_blockquote]:italic [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-primary [&_a]:underline [&_img]:rounded-lg [&_.callout]:my-3 [&_.callout]:rounded-lg [&_.callout]:border [&_.callout]:p-3 [&_.callout-info]:border-primary/40 [&_.callout-info]:bg-sage/40 [&_.callout-warning]:border-amber-400 [&_.callout-warning]:bg-amber-50 [&_.callout-tip]:border-primary [&_.callout-tip]:bg-primary/5"
          dangerouslySetInnerHTML={{ __html: lesson.body }}
        />
      )}

      {lesson.attachments?.length > 0 && (
        <div className="mt-8 rounded-xl2 border border-line bg-white p-5">
          <h2 className="mb-3 font-display text-sm font-bold text-primary-dark">Downloadable resources</h2>
          <ul className="space-y-2">
            {lesson.attachments.map((attachment, index) => (
              // eslint-disable-next-line react/no-array-index-key -- attachments have no stable id
              <li key={index}>
                <a
                  href={`/api/lessons/${lessonId}/media?fileKind=attachment-${index}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  <Download size={14} aria-hidden="true" />
                  {attachment.label || attachment.filename}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
