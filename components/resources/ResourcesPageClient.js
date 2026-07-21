'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Search, ChevronLeft, ChevronRight, Library, Star } from 'lucide-react';
import ResourceCard from './ResourceCard';
import { FILE_TYPES } from '@/lib/resourceOptions';
import { ACCESS_LEVELS } from '@/lib/access/accessLevels';

// Mirrors components/courses/CoursesPageClient.js exactly (category nav +
// toolbar + grid + pagination in one file), extended with the two extra
// filters the Resource Library brief calls for beyond Courses' set — File
// Type and a dedicated Featured toggle (Courses only has a "featured"
// *sort*, not a filter — see lib/publicResources.js). Search is
// server-side via GET /api/resources's `search` param, which hits
// Resource's title/description/tags/keywords/author text index
// (models/Resource.js) — Title/Description/Tags/Keywords/Author, exactly
// the Sprint 19.3 brief's Search requirement.

function readFiltersFromParams(searchParams) {
  return {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    fileType: searchParams.get('fileType') || '',
    accessLevel: searchParams.get('accessLevel') || '',
    featured: searchParams.get('featured') === 'true',
    tag: searchParams.get('tag') || '',
    sort: searchParams.get('sort') || '',
    page: Number(searchParams.get('page')) || 1,
  };
}

const SORT_OPTIONS = [
  { value: '', label: 'Display order' },
  { value: 'newest', label: 'Newest' },
  { value: 'title-asc', label: 'Title A–Z' },
];

export default function ResourcesPageClient({ initialResources, initialPagination, initialFilters, facets }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.search || '');
  const [resources, setResources] = useState(initialResources);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);
  const lastAppliedParams = useRef(searchParams.toString());

  const fetchResources = useCallback(
    async (nextFilters, { syncUrl = true } = {}) => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (nextFilters.search) params.set('search', nextFilters.search);
        if (nextFilters.category) params.set('category', nextFilters.category);
        if (nextFilters.fileType) params.set('fileType', nextFilters.fileType);
        if (nextFilters.accessLevel) params.set('accessLevel', nextFilters.accessLevel);
        if (nextFilters.featured) params.set('featured', 'true');
        if (nextFilters.tag) params.set('tag', nextFilters.tag);
        if (nextFilters.sort) params.set('sort', nextFilters.sort);
        params.set('page', String(nextFilters.page || 1));
        params.set('limit', '12');
        const qs = params.toString();

        const res = await fetch(`/api/resources?${qs}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError('Could not load resources right now. Please try again.');
          return;
        }

        setFilters(nextFilters);
        setResources(data.resources);
        setPagination(data.pagination);
        lastAppliedParams.current = qs;
        if (syncUrl) router.replace(`/resources?${qs}`, { scroll: false });
      } catch (err) {
        setError('Could not load resources right now. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    const currentQs = searchParams.toString();
    if (currentQs === lastAppliedParams.current) return;

    const next = readFiltersFromParams(searchParams);
    setSearchInput(next.search);
    fetchResources(next, { syncUrl: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function updateFilters(patch) {
    fetchResources({ ...filters, ...patch, page: patch.page ?? 1 });
  }

  function handleSearchChange(value) {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateFilters({ search: value }), 350);
  }

  const categoryTabs = [{ slug: '', name: 'All categories' }, ...(facets?.categories || [])];

  return (
    <div className="mx-auto max-w-content px-6 py-12 md:py-16">
      {categoryTabs.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categoryTabs.map((c) => (
            <button
              key={c.slug || 'all'}
              type="button"
              onClick={() => updateFilters({ category: c.slug })}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                filters.category === c.slug
                  ? 'border-primary bg-primary text-white'
                  : 'border-line text-muted hover:border-primary hover:text-primary'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by title, tag, author, or keyword…"
            className="w-full rounded-full border border-line bg-white py-2.5 pl-9 pr-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => updateFilters({ featured: !filters.featured })}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
              filters.featured
                ? 'border-primary bg-primary text-white'
                : 'border-line text-muted hover:border-primary hover:text-primary'
            }`}
          >
            <Star size={14} className={filters.featured ? 'fill-current' : ''} aria-hidden="true" />
            Featured
          </button>
          <select
            value={filters.fileType}
            onChange={(e) => updateFilters({ fileType: e.target.value })}
            className="rounded-full border border-line bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All file types</option>
            {FILE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={filters.accessLevel}
            onChange={(e) => updateFilters({ accessLevel: e.target.value })}
            className="rounded-full border border-line bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All access levels</option>
            {Object.values(ACCESS_LEVELS).map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <select
            value={filters.sort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="rounded-full border border-line bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted">
            {pagination.total} resource{pagination.total === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-accent-dark">{error}</p>}

      {loading ? (
        <div className="mt-10 flex items-center justify-center gap-2 py-16 text-sm text-muted">
          <Loader2 size={18} className="animate-spin" />
          Loading resources…
        </div>
      ) : resources.length === 0 ? (
        <div className="mt-10 flex flex-col items-center py-16 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
            <Library size={20} />
          </span>
          <p className="font-display text-base font-semibold text-ink">No resources found</p>
          <p className="mt-1 max-w-xs text-sm text-muted">Try a different search term or filter.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <ResourceCard key={resource._id} resource={resource} />
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => updateFilters({ page: pagination.page - 1 })}
            disabled={pagination.page <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted hover:border-primary hover:text-primary disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-ink">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            type="button"
            onClick={() => updateFilters({ page: pagination.page + 1 })}
            disabled={pagination.page >= pagination.pages}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted hover:border-primary hover:text-primary disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
