import { Eyebrow } from '@/components/ui';
import CoursesPageClient from '@/components/courses/CoursesPageClient';
import FeaturedCourses from '@/components/courses/FeaturedCourses';
import { getPublishedCourses, getFeaturedCourses, getActiveCourseCategories } from '@/lib/publicCourses';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Courses',
  description:
    'Structured, self-paced courses on healthy aging, mobility, and independent living — built with our founding doctors.',
  alternates: { canonical: '/courses' },
  openGraph: { title: 'Courses | Stronger Steps', url: '/courses' },
};

/**
 * Sprint 19.2 — the real Courses listing page. Reachable from the
 * Knowledge Center's "Courses" section (a "View all courses" link), not a
 * new top-level header nav item — see docs/13_DECISIONS.md for why.
 */
export default async function CoursesPage({ searchParams }) {
  const initialFilters = {
    search: searchParams?.search || '',
    category: searchParams?.category || '',
    difficulty: searchParams?.difficulty || '',
    tag: searchParams?.tag || '',
    sort: searchParams?.sort || '',
    page: Number(searchParams?.page) || 1,
  };

  const [{ courses, pagination }, featuredCourses, categories] = await Promise.all([
    getPublishedCourses({ ...initialFilters, limit: 12 }),
    getFeaturedCourses(3),
    getActiveCourseCategories(),
  ]);

  return (
    <>
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <Eyebrow>Courses</Eyebrow>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold text-primary-dark md:text-4xl">
            Structured learning, built for your Stronger Steps
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Self-paced courses designed with our founding doctors — browse by category, search by
            instructor or topic, and pick up right where you left off.
          </p>
        </div>
      </section>

      <FeaturedCourses courses={featuredCourses} />

      <section className="bg-bg">
        <CoursesPageClient
          initialCourses={courses}
          initialPagination={pagination}
          initialFilters={initialFilters}
          facets={{ categories }}
        />
      </section>
    </>
  );
}
