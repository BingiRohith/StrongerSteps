'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductsSidebar from './ProductsSidebar';
import ProductsToolbar from './ProductsToolbar';
import ProductGrid from './ProductGrid';
import ProductsPagination from './ProductsPagination';

function readFiltersFromParams(searchParams) {
  return {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    availability: searchParams.get('availability') || '',
    sort: searchParams.get('sort') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    page: Number(searchParams.get('page')) || 1,
  };
}

/**
 * Owns all Products-page filter/sort/search/pagination state and talks to
 * the public `/api/products` route directly (Sprint 12.5) — filtering,
 * sorting, and pagination are all server-side, so the client never holds
 * more than one page of the catalog at a time. The first render uses
 * `initialProducts`/`initialPagination` (already fetched server-side by
 * app/products/page.js for the current URL's filters, no flash/refetch);
 * every filter change calls fetchProducts directly from its handler (same
 * pattern as components/infographics/InfographicsGrid.js) rather than via a
 * useEffect watching state, so there's no redundant fetch on mount.
 *
 * Also watches `useSearchParams()` so a navigation to /products?search=...
 * that happens while this component is already mounted (e.g. picking a
 * result from the header's ProductSearchDropdown) still refreshes the grid
 * — React reuses the existing component instance on client-side navigation
 * within the same route, so `useState(initialProducts)` alone would
 * otherwise keep showing stale data from before that navigation.
 */
export default function ProductsPageClient({ initialProducts, initialPagination, initialFilters, facets }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.search || '');
  const [products, setProducts] = useState(initialProducts);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);
  // Tracks the query string this component itself last produced via
  // router.replace, so the sync effect below can tell "the URL changed
  // because we changed it" apart from "the URL changed some other way".
  const lastAppliedParams = useRef(searchParams.toString());

  const fetchProducts = useCallback(async (nextFilters, { syncUrl = true } = {}) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (nextFilters.search) params.set('search', nextFilters.search);
      if (nextFilters.category) params.set('category', nextFilters.category);
      if (nextFilters.brand) params.set('brand', nextFilters.brand);
      if (nextFilters.availability) params.set('availability', nextFilters.availability);
      if (nextFilters.sort) params.set('sort', nextFilters.sort);
      if (nextFilters.minPrice !== undefined && nextFilters.minPrice !== '') params.set('minPrice', nextFilters.minPrice);
      if (nextFilters.maxPrice !== undefined && nextFilters.maxPrice !== '') params.set('maxPrice', nextFilters.maxPrice);
      params.set('page', String(nextFilters.page || 1));
      params.set('limit', '12');
      const qs = params.toString();

      const res = await fetch(`/api/products?${qs}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError('Could not load products right now. Please try again.');
        return;
      }

      setFilters(nextFilters);
      setProducts(data.products);
      setPagination(data.pagination);
      lastAppliedParams.current = qs;
      if (syncUrl) router.replace(`/products?${qs}`, { scroll: false });
    } catch (err) {
      setError('Could not load products right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const currentQs = searchParams.toString();
    if (currentQs === lastAppliedParams.current) return;

    const next = readFiltersFromParams(searchParams);
    setSearchInput(next.search);
    fetchProducts(next, { syncUrl: false });
    // fetchProducts is stable (useCallback[router]); re-running only on searchParams change is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function updateFilters(patch) {
    fetchProducts({ ...filters, ...patch, page: patch.page ?? 1 });
  }

  function handleSearchChange(value) {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateFilters({ search: value }), 350);
  }

  function handlePageChange(nextPage) {
    fetchProducts({ ...filters, page: nextPage });
  }

  return (
    <div className="mx-auto max-w-content px-6 py-12 md:py-16">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <ProductsSidebar facets={facets} filters={filters} onChange={updateFilters} />

        <div>
          <ProductsToolbar
            searchValue={searchInput}
            onSearchChange={handleSearchChange}
            sort={filters.sort}
            onSortChange={(sort) => updateFilters({ sort })}
            total={pagination.total}
          />

          {error && <p className="mt-4 text-sm text-accent-dark">{error}</p>}

          <ProductGrid products={products} loading={loading} />

          <ProductsPagination pagination={pagination} onPageChange={handlePageChange} />
        </div>
      </div>
    </div>
  );
}
