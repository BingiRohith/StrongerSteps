import { Eyebrow } from '@/components/ui';
import ResourcesPageClient from '@/components/resources/ResourcesPageClient';
import FeaturedResources from '@/components/resources/FeaturedResources';
import { getPublishedResources, getFeaturedResources, getActiveResourceCategories } from '@/lib/publicResources';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Resources',
  description:
    'Clinically validated guides, checklists, and downloadable resources on healthy aging, mobility, and independent living from Stronger Steps.',
  alternates: { canonical: '/resources' },
  openGraph: { title: 'Resources | Stronger Steps', url: '/resources' },
};

/**
 * Sprint 19.3 — the real Resource Library listing page. Reachable from the
 * Knowledge Center's "Resources" section (a "View all resources" link),
 * not a new top-level header nav item — same precedent Sprint 19.2 set for
 * Courses (docs/13_DECISIONS.md).
 */
export default async function ResourcesPage({ searchParams }) {
  const initialFilters = {
    search: searchParams?.search || '',
    category: searchParams?.category || '',
    fileType: searchParams?.fileType || '',
    accessLevel: searchParams?.accessLevel || '',
    featured: searchParams?.featured === 'true',
    tag: searchParams?.tag || '',
    sort: searchParams?.sort || '',
    page: Number(searchParams?.page) || 1,
  };

  const [{ resources, pagination }, featuredResources, categories] = await Promise.all([
    getPublishedResources({ ...initialFilters, limit: 12 }),
    getFeaturedResources(3),
    getActiveResourceCategories(),
  ]);

  return (
    <>
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <Eyebrow>Resources</Eyebrow>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold text-primary-dark md:text-4xl">
            Guides, checklists, and downloads for healthy aging
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Clinically validated resources you can read, save, or share — browse by category,
            search by topic, and download what you need.
          </p>
        </div>
      </section>

      <FeaturedResources resources={featuredResources} />

      <section className="bg-bg">
        <ResourcesPageClient
          initialResources={resources}
          initialPagination={pagination}
          initialFilters={initialFilters}
          facets={{ categories }}
        />
      </section>
    </>
  );
}
