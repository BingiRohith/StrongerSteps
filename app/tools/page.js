import { Eyebrow } from '@/components/ui';
import ToolsPageClient from '@/components/tools/ToolsPageClient';
import FeaturedTools from '@/components/tools/FeaturedTools';
import { getPublishedTools, getFeaturedTools, getActiveToolCategories } from '@/lib/publicTools';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tools',
  description:
    'Free, doctor-informed assessments and calculators to understand your own risk factors — fall risk, and more, from Stronger Steps.',
  alternates: { canonical: '/tools' },
  openGraph: { title: 'Tools | Stronger Steps', url: '/tools' },
};

/**
 * Sprint 19.4 — the real Tools CMS listing page, mirroring
 * app/resources/page.js exactly. Reachable from the Knowledge Center's
 * "Tools" section (a "View all tools" link), not a new top-level header
 * nav item — same precedent Sprint 19.2/19.3 set for Courses/Resources
 * (docs/13_DECISIONS.md).
 */
export default async function ToolsPage({ searchParams }) {
  const initialFilters = {
    search: searchParams?.search || '',
    category: searchParams?.category || '',
    toolType: searchParams?.toolType || '',
    accessLevel: searchParams?.accessLevel || '',
    featured: searchParams?.featured === 'true',
    tag: searchParams?.tag || '',
    sort: searchParams?.sort || '',
    page: Number(searchParams?.page) || 1,
  };

  const [{ tools, pagination }, featuredTools, categories] = await Promise.all([
    getPublishedTools({ ...initialFilters, limit: 12 }),
    getFeaturedTools(3),
    getActiveToolCategories(),
  ]);

  return (
    <>
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <Eyebrow>Tools</Eyebrow>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold text-primary-dark md:text-4xl">
            Free assessments you can take in minutes
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Simple, doctor-informed tools that help you understand your own risk factors —
            browse by category, search by topic, and get a personalized result.
          </p>
        </div>
      </section>

      <FeaturedTools tools={featuredTools} />

      <section className="bg-bg">
        <ToolsPageClient
          initialTools={tools}
          initialPagination={pagination}
          initialFilters={initialFilters}
          facets={{ categories }}
        />
      </section>
    </>
  );
}
