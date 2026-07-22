import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, BarChart3, Globe, Award, CheckCircle2, GraduationCap } from 'lucide-react';
import { Badge, Button, SectionHeading } from '@/components/ui';
import StepDivider from '@/components/StepDivider';
import CourseCard from '@/components/courses/CourseCard';
import CourseCurriculumAccordion from '@/components/courses/CourseCurriculumAccordion';
import { getCourseBySlug, getRelatedCourses } from '@/lib/publicCourses';
import { formatCourseDuration } from '@/lib/courseOptions';
import { getCurrentActor } from '@/lib/access/actor';
import { getCurrentLead } from '@/lib/access/leadSession';
import { annotateCourseAccess } from '@/lib/courseAccess';
import connectDB from '@/lib/db';
import CourseProgress from '@/models/CourseProgress';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const course = await getCourseBySlug(params.slug);
  if (!course) return { title: 'Course not found' };

  const title = course.seo?.title || course.title;
  const description = course.seo?.metaDescription || course.description || undefined;
  const ogImages = course.thumbnail?.url
    ? [{ url: course.thumbnail.url, alt: course.thumbnail.alt || course.title }]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/courses/${course.slug}` },
    openGraph: { title, description, type: 'article', images: ogImages },
    twitter: { card: ogImages ? 'summary_large_image' : 'summary', title, description, images: ogImages },
  };
}

export default async function CourseDetailPage({ params }) {
  const course = await getCourseBySlug(params.slug);
  if (!course) notFound();

  const actor = await getCurrentActor();
  const annotated = annotateCourseAccess(course, actor);
  const related = await getRelatedCourses(course, 3);

  const firstLesson = annotated.sections.find((s) => s.lessons.length > 0)?.lessons[0];
  const totalLessons = annotated.sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const totalDurationLabel = formatCourseDuration(course.totalEstimatedDuration);

  // "Resume learning" — only for a VerifiedLead with existing progress on
  // this course (Sprint 19.5 decision: no anonymous progress tracking).
  const lead = await getCurrentLead();
  let resumeLessonId = null;
  let progressForAccordion = null;
  if (lead) {
    await connectDB();
    const progress = await CourseProgress.findOne({ lead: lead._id, course: course._id }).lean();
    if (progress) {
      if (progress.currentLesson) resumeLessonId = String(progress.currentLesson);
      progressForAccordion = {
        completedLessons: progress.completedLessons.map((c) => String(c.lesson)),
        currentLesson: progress.currentLesson ? String(progress.currentLesson) : null,
      };
    }
  }

  // Schema.org Course structured data — CRS §... Sprint 19.2's "SEO: Structured
  // Data where appropriate" requirement. See https://schema.org/Course.
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description || course.seo?.metaDescription || undefined,
    provider: {
      '@type': 'Organization',
      name: 'Stronger Steps',
    },
    ...(course.instructors?.length
      ? { instructor: course.instructors.map((i) => ({ '@type': 'Person', name: i.name })) }
      : {}),
  };

  return (
    <>
      {/* eslint-disable-next-line react/no-danger -- static, server-generated JSON-LD, no user input reflected unescaped */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <Link href="/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Courses
          </Link>

          <div className="mt-6 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {course.category?.name && <Badge tone="accent">{course.category.name}</Badge>}
              {course.accessLevel !== 'PUBLIC' && <Badge tone="sage">{course.accessLevel}</Badge>}
              {course.certificateAvailable && (
                <Badge tone="primary">
                  <Award size={11} className="mr-1 -ml-0.5" aria-hidden="true" />
                  Certificate
                </Badge>
              )}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-primary-dark md:text-4xl">
              {course.title}
            </h1>
            {course.description && <p className="mt-4 text-lg text-muted">{course.description}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-muted">
              {course.duration && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={15} aria-hidden="true" />
                  {course.duration}
                </span>
              )}
              {!course.duration && totalDurationLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={15} aria-hidden="true" />
                  {totalDurationLabel} total
                </span>
              )}
              {course.difficulty && (
                <span className="inline-flex items-center gap-1.5">
                  <BarChart3 size={15} aria-hidden="true" />
                  {course.difficulty}
                </span>
              )}
              {course.language && (
                <span className="inline-flex items-center gap-1.5">
                  <Globe size={15} aria-hidden="true" />
                  {course.language}
                </span>
              )}
              <span>{totalLessons} lesson{totalLessons === 1 ? '' : 's'}</span>
            </div>

            {firstLesson && (
              <div className="mt-8">
                <Button href={`/courses/${course.slug}/lessons/${resumeLessonId || firstLesson._id}`}>
                  {resumeLessonId ? 'Resume learning' : 'Start learning'}
                </Button>
              </div>
            )}
          </div>

          {(course.banner?.url || course.thumbnail?.url) && (
            <div className="mt-10 aspect-[16/6] w-full overflow-hidden rounded-xl2 bg-sage">
              {/* eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file, not an optimizable remote image */}
              <img
                src={course.banner?.url || course.thumbnail?.url}
                alt={course.banner?.alt || course.thumbnail?.alt || course.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </section>

      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 pb-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
            <div>
              {course.longDescription && (
                <p className="mb-8 whitespace-pre-line text-base leading-relaxed text-ink">
                  {course.longDescription}
                </p>
              )}

              {course.whatYoullLearn?.length > 0 && (
                <div className="mb-10 rounded-xl2 border border-line bg-white p-6">
                  <h2 className="mb-4 font-display text-lg font-bold text-primary-dark">What you&apos;ll learn</h2>
                  <ul className="grid gap-2.5 sm:grid-cols-2">
                    {course.whatYoullLearn.map((item, index) => (
                      // eslint-disable-next-line react/no-array-index-key -- plain strings, no stable id
                      <li key={index} className="flex items-start gap-2 text-sm text-ink">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <h2 className="mb-4 font-display text-2xl font-bold text-primary-dark">Curriculum</h2>
              <CourseCurriculumAccordion courseSlug={course.slug} sections={annotated.sections} progress={progressForAccordion} />

              {course.learningOutcomes?.length > 0 && (
                <div className="mt-10">
                  <h2 className="mb-4 font-display text-xl font-bold text-primary-dark">Learning outcomes</h2>
                  <ul className="space-y-2">
                    {course.learningOutcomes.map((item, index) => (
                      // eslint-disable-next-line react/no-array-index-key -- plain strings, no stable id
                      <li key={index} className="flex items-start gap-2.5 text-sm text-ink">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <aside className="space-y-6 lg:sticky lg:top-8 lg:h-fit">
              {course.instructors?.length > 0 && (
                <div className="rounded-xl2 border border-line bg-white p-6">
                  <h2 className="mb-3 font-display text-lg font-bold text-primary-dark">
                    {course.instructors.length === 1 ? 'Instructor' : 'Instructors'}
                  </h2>
                  <div className="space-y-4">
                    {course.instructors.map((instructor, index) => (
                      // eslint-disable-next-line react/no-array-index-key -- instructors have no stable id on the public payload
                      <div key={index}>
                        <div className="flex items-center gap-3">
                          {instructor.photo?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file
                            <img
                              src={instructor.photo.url}
                              alt={instructor.photo.alt || instructor.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
                              <GraduationCap size={18} />
                            </span>
                          )}
                          <div>
                            <p className="font-display text-sm font-semibold text-ink">{instructor.name}</p>
                            {instructor.title && <p className="text-xs text-muted">{instructor.title}</p>}
                          </div>
                        </div>
                        {instructor.bio && <p className="mt-3 text-sm text-muted">{instructor.bio}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {course.prerequisites?.length > 0 && (
                <div className="rounded-xl2 border border-line bg-white p-6">
                  <h2 className="mb-3 font-display text-lg font-bold text-primary-dark">Prerequisites</h2>
                  <ul className="space-y-2">
                    {course.prerequisites.map((item, index) => (
                      // eslint-disable-next-line react/no-array-index-key -- plain strings, no stable id
                      <li key={index} className="flex items-start gap-2.5 text-sm text-ink">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {course.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {course.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-sage px-2.5 py-1 text-xs font-semibold capitalize text-primary-dark">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <>
          <StepDivider from="#FBF7EF" to="#E6EEE4" />
          <section className="bg-sage">
            <div className="mx-auto max-w-content px-6 py-16 md:py-20">
              <SectionHeading eyebrow="Keep learning" title="More courses like this" description="Other courses from the same category." />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <CourseCard key={item._id} course={item} />
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
