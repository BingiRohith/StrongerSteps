import { ArrowRight } from 'lucide-react';
import { Button, Eyebrow } from '@/components/ui';
import ProductsPageClient from '@/components/products/ProductsPageClient';
import { getPublishedProducts, getProductFilterFacets } from '@/lib/publicProducts';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Products',
  description:
    'Browse mobility aids, wellness products, and healthy-aging essentials curated by Stronger Steps for adults 50+.',
  alternates: { canonical: '/products' },
  openGraph: { title: 'Products | Stronger Steps', url: '/products' },
};

/**
 * Marketplace-style redesign (Sprint 12.5) — sidebar filters + toolbar
 * (search/sort) + grid + pagination, all server-driven via the (extended)
 * public Products API. UX layout takes inspiration from familiar
 * marketplace conventions per the brief, while keeping Stronger Steps
 * branding (design tokens from tailwind.config.js, existing ProductCard).
 * The initial page load is fully server-rendered for whatever filters are
 * in the URL (e.g. a header-search deep link to /products?search=cane) —
 * no client refetch flash — client interactivity takes over afterward.
 */
export default async function ProductsPage({ searchParams }) {
  const initialFilters = {
    search: searchParams?.search || '',
    category: searchParams?.category || '',
    brand: searchParams?.brand || '',
    availability: searchParams?.availability || '',
    sort: searchParams?.sort || '',
    minPrice: searchParams?.minPrice || '',
    maxPrice: searchParams?.maxPrice || '',
    page: Number(searchParams?.page) || 1,
  };

  const [{ products, pagination }, facets] = await Promise.all([
    getPublishedProducts({ ...initialFilters, limit: 12 }),
    getProductFilterFacets(),
  ]);

  return (
    <>
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <Eyebrow>Products</Eyebrow>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold text-primary-dark md:text-4xl">
            Tools and products that support your stronger years
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Curated mobility aids, educational products, and branded merchandise — all selected by our doctors with the 50+ community in mind.
          </p>
        </div>
      </section>

      <ProductsPageClient
        initialProducts={products}
        initialPagination={pagination}
        initialFilters={initialFilters}
        facets={facets}
      />

      <section className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-12 md:py-16">
          <div className="rounded-xl2 bg-primary-dark p-8 text-white">
            <h3 className="font-display text-xl font-bold">Be the first to know when checkout goes live</h3>
            <p className="mt-2 text-white/75">Join our community and we'll notify you as soon as you can buy directly on the site.</p>
            <Button href="/join" variant="accent" className="mt-5">
              Join the Community <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
