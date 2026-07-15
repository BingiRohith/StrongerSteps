import { Eyebrow } from '@/components/ui';
import RecipesPageClient from '@/components/recipes/RecipesPageClient';
import FeaturedRecipes from '@/components/recipes/FeaturedRecipes';
import {
  getPublishedRecipes,
  getFeaturedRecipes,
  getActiveRecipeCategories,
  getRecipeTagsFacet,
} from '@/lib/publicRecipes';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Recipes',
  description:
    'Discover healthy, easy-to-prepare recipes designed for adults 50+ — browse by category, search, and filter on Stronger Steps.',
  alternates: { canonical: '/recipes' },
  openGraph: { title: 'Recipes | Stronger Steps', url: '/recipes' },
};

/**
 * Full CMS-driven Recipes module (Sprint 13) — replaces the Sprint 10
 * placeholder. Hero + Featured Recipes + Category Navigation + search/
 * filter/paginated "Latest Recipes" grid, all backed by MongoDB via
 * lib/publicRecipes.js. Mirrors app/products/page.js's server-render +
 * client-interactivity split (Sprint 12.5 pattern).
 */
export default async function RecipesPage({ searchParams }) {
  const initialFilters = {
    search: searchParams?.search || '',
    category: searchParams?.category || '',
    tag: searchParams?.tag || '',
    difficulty: searchParams?.difficulty || '',
    sort: searchParams?.sort || '',
    page: Number(searchParams?.page) || 1,
  };

  const [{ recipes, pagination }, featuredRecipes, categories, tags] = await Promise.all([
    getPublishedRecipes({ ...initialFilters, limit: 12 }),
    getFeaturedRecipes(3),
    getActiveRecipeCategories(),
    getRecipeTagsFacet(),
  ]);

  return (
    <>
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <Eyebrow>Recipes</Eyebrow>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold text-primary-dark md:text-4xl">
            Eating for strength, the Indian way
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Doctor-reviewed recipes built around the nutrition adults 50+ need most — browse by
            category, search by name, or filter by tag and difficulty.
          </p>
        </div>
      </section>

      <FeaturedRecipes recipes={featuredRecipes} />

      <section className="bg-bg">
        <RecipesPageClient
          initialRecipes={recipes}
          initialPagination={pagination}
          initialFilters={initialFilters}
          facets={{ categories, tags }}
        />
      </section>
    </>
  );
}
