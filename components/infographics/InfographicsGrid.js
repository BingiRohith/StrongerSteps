'use client';

import { useCallback, useRef, useState } from 'react';
import { Search, Loader2, Image as ImageIcon } from 'lucide-react';
import InfographicCard from './InfographicCard';
import InfographicViewer from './InfographicViewer';

const PAGE_SIZE = 18;

export default function InfographicsGrid({ initialInfographics, initialPagination, categories }) {
  const [infographics, setInfographics] = useState(initialInfographics || []);
  const [pagination, setPagination] = useState(
    initialPagination || { page: 1, limit: PAGE_SIZE, total: 0, pages: 1 }
  );
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(null);
  const debounceRef = useRef(null);

  const fetchInfographics = useCallback(async ({ search, category, page, append }) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (search?.trim()) params.set('search', search.trim());
      if (category) params.set('category', category);
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));

      const res = await fetch(`/api/infographics?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError('Could not load infographics right now. Please try again.');
        return;
      }

      setInfographics((prev) => (append ? [...prev, ...data.infographics] : data.infographics));
      setPagination(data.pagination);
    } catch (err) {
      setError('Could not load infographics right now. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  function handleSearchChange(e) {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchInfographics({ search: value, category: activeCategory, page: 1, append: false });
    }, 350);
  }

  function handleCategoryClick(cat) {
    const next = activeCategory === cat ? '' : cat;
    setActiveCategory(next);
    fetchInfographics({ search: query, category: next, page: 1, append: false });
  }

  function handleLoadMore() {
    fetchInfographics({ search: query, category: activeCategory, page: pagination.page + 1, append: true });
  }

  const hasMore = pagination.page < pagination.pages;

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <label className="relative w-full md:max-w-sm">
          <span className="sr-only">Search infographics</span>
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={handleSearchChange}
            placeholder="Search infographics (e.g. Falls, Nutrition...)"
            className="w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-4 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </label>

        {categories?.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleCategoryClick(cat)}
                  className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-primary text-white'
                      : 'bg-white text-primary-dark border border-line hover:border-primary'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-accent-dark">{error}</p>}

      {loading ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading infographics">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl2 border border-line bg-white">
              <div className="aspect-[4/3] w-full bg-sage" />
              <div className="space-y-2 p-5">
                <div className="h-4 w-3/4 rounded bg-sage" />
                <div className="h-3 w-full rounded bg-sage" />
                <div className="h-3 w-2/3 rounded bg-sage" />
              </div>
            </div>
          ))}
        </div>
      ) : infographics.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {infographics.map((infographic) => (
            <InfographicCard key={infographic._id} infographic={infographic} onView={setViewing} />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl2 border border-dashed border-line bg-white/70 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary">
            <ImageIcon size={20} aria-hidden="true" />
          </span>
          <p className="font-display text-sm font-semibold text-primary-dark">No infographics found</p>
          <p className="max-w-sm text-sm text-muted">
            Try a different search term{categories?.length ? ' or category' : ''}, or check back soon — we're
            adding new visuals regularly.
          </p>
        </div>
      )}

      {hasMore && !loading && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-6 py-2.5 font-display text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {loadingMore ? 'Loading…' : 'Load more infographics'}
          </button>
        </div>
      )}

      <InfographicViewer infographic={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
