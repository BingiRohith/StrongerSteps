'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CategoryNav from './CategoryNav';
import RecipesSidebar from './RecipesSidebar';
import RecipesToolbar from './RecipesToolbar';
import RecipeGrid from './RecipeGrid';
import RecipesPagination from './RecipesPagination';

function readFiltersFromParams(searchParams) {
  return {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    tag: searchParams.get('tag') || '',
    difficulty: searchParams.get('difficulty') || '',
    sort: searchParams.get('sort') || '',
    page: Number(searchParams.get('page')) || 1,
  };
}

/**
 * Owns all Recipes-page filter/sort/search/pagination state and talks to
 * the public `/api/recipes` route directly — filtering, sorting, and
 * pagination are all server-side (per the CRS — never fetch the entire
 * collection into the browser), mirroring
 * components/products/ProductsPageClient.js (Sprint 12.5 pattern).
 */
export default function RecipesPageClient({ initialRecipes, initialPagination, initialFilters, facets }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.search || '');
  const [recipes, setRecipes] = useState(initialRecipes);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);
  const lastAppliedParams = useRef(searchParams.toString());

  const fetchRecipes = useCallback(async (nextFilters, { syncUrl = true } = {}) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (nextFilters.search) params.set('search', nextFilters.search);
      if (nextFilters.category) params.set('category', nextFilters.category);
      if (nextFilters.tag) params.set('tag', nextFilters.tag);
      if (nextFilters.difficulty) params.set('difficulty', nextFilters.difficulty);
      if (nextFilters.sort) params.set('sort', nextFilters.sort);
      params.set('page', String(nextFilters.page || 1));
      params.set('limit', '12');
      const qs = params.toString();

      const res = await fetch(`/api/recipes?${qs}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError('Could not load recipes right now. Please try again.');
        return;
      }

      setFilters(nextFilters);
      setRecipes(data.recipes);
      setPagination(data.pagination);
      lastAppliedParams.current = qs;
      if (syncUrl) router.replace(`/recipes?${qs}`, { scroll: false });
    } catch (err) {
      setError('Could not load recipes right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const currentQs = searchParams.toString();
    if (currentQs === lastAppliedParams.current) return;

    const next = readFiltersFromParams(searchParams);
    setSearchInput(next.search);
    fetchRecipes(next, { syncUrl: false });
    // fetchRecipes is stable (useCallback[router]); re-running only on searchParams change is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function updateFilters(patch) {
    fetchRecipes({ ...filters, ...patch, page: patch.page ?? 1 });
  }

  function handleSearchChange(value) {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateFilters({ search: value }), 350);
  }

  function handlePageChange(nextPage) {
    fetchRecipes({ ...filters, page: nextPage });
  }

  return (
    <div className="mx-auto max-w-content px-6 py-12 md:py-16">
      <CategoryNav
        categories={facets.categories}
        activeSlug={filters.category}
        onChange={(category) => updateFilters({ category })}
      />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <RecipesSidebar facets={facets} filters={filters} onChange={updateFilters} />

        <div>
          <RecipesToolbar
            searchValue={searchInput}
            onSearchChange={handleSearchChange}
            sort={filters.sort}
            onSortChange={(sort) => updateFilters({ sort })}
            total={pagination.total}
          />

          {error && <p className="mt-4 text-sm text-accent-dark">{error}</p>}

          <RecipeGrid recipes={recipes} loading={loading} />

          <RecipesPagination pagination={pagination} onPageChange={handlePageChange} />
        </div>
      </div>
    </div>
  );
}
