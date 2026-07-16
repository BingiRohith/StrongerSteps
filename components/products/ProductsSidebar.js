'use client';

import { useState } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';

/**
 * Filter options are all derived from real data (facets, fetched once by
 * app/products/page.js via lib/publicProducts.js's getProductFilterFacets())
 * — nothing here is hardcoded. Categories come from the fully admin-managed
 * models/ProductCategory.js as of Sprint 18 (see docs/13_DECISIONS.md);
 * "dynamic" means only categories/brands that actually have a published
 * product are shown, not a duplicated list.
 *
 * Sprint 18 responsive behavior (Module 3):
 * - Desktop (lg+): sticky within the grid column (`lg:sticky lg:top-24
 *   lg:self-start`, applied by the parent grid via className below) —
 *   clears the sticky Header and auto-unsticks once it scrolls past its own
 *   content, so it can never overlap the footer.
 * - Tablet (md–lg): normal stacked layout, always expanded, not sticky.
 * - Mobile (<md): a collapsible accordion — collapsed by default behind a
 *   "Filters" toggle with an active-filter count, rather than a separate
 *   drawer/dialog component (simpler to maintain, no portal/focus-trap
 *   needed). `mobileOpen` only affects rendering below `md`; at `md`+ the
 *   filter groups are always visible regardless of this state.
 */
export default function ProductsSidebar({ facets, filters, onChange }) {
  const { categories, brands, priceRange } = facets;
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCount = [
    filters.category,
    filters.brand,
    filters.availability,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length;
  const hasActiveFilters = activeCount > 0;

  function clearAll() {
    onChange({ category: '', brand: '', availability: '', minPrice: '', maxPrice: '' });
  }

  return (
    <aside className="h-fit rounded-xl2 border border-line bg-white p-5 lg:sticky lg:top-28 lg:self-start">
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        aria-controls="products-filter-groups"
        className="flex w-full items-center justify-between md:hidden"
      >
        <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-primary-dark">
          <SlidersHorizontal size={16} aria-hidden="true" />
          Filters
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown
          size={18}
          className={`text-primary transition-transform duration-200 ${mobileOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <div className="hidden items-center justify-between md:flex">
        <h2 className="font-display text-sm font-bold text-primary-dark">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-primary"
          >
            <X size={12} aria-hidden="true" />
            Clear all
          </button>
        )}
      </div>

      <div id="products-filter-groups" className={`${mobileOpen ? 'block' : 'hidden'} md:block`}>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-primary md:hidden"
          >
            <X size={12} aria-hidden="true" />
            Clear all
          </button>
        )}

        {categories?.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Category</h3>
            <div className="mt-2 flex flex-col gap-1.5">
              {categories.map((c) => {
                const active = filters.category === c.slug;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange({ category: active ? '' : c.slug })}
                    className={`rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${
                      active ? 'bg-primary text-white' : 'text-ink/80 hover:bg-sage'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {brands?.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Brand</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {brands.map((brand) => {
                const active = filters.brand === brand;
                return (
                  <button
                    key={brand}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange({ brand: active ? '' : brand })}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active ? 'bg-primary text-white' : 'border border-line text-ink/80 hover:border-primary'
                    }`}
                  >
                    {brand}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {priceRange && priceRange.max > priceRange.min && (
          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Price</h3>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={priceRange.min}
                max={priceRange.max}
                value={filters.minPrice ?? ''}
                onChange={(e) => onChange({ minPrice: e.target.value })}
                placeholder={`₹${priceRange.min}`}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-muted">–</span>
              <input
                type="number"
                min={priceRange.min}
                max={priceRange.max}
                value={filters.maxPrice ?? ''}
                onChange={(e) => onChange({ maxPrice: e.target.value })}
                placeholder={`₹${priceRange.max}`}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        )}

        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Availability</h3>
          <div className="mt-2 flex flex-col gap-1.5">
            {[
              { value: '', label: 'All' },
              { value: 'in-stock', label: 'In stock' },
              { value: 'out-of-stock', label: 'Out of stock' },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-ink/80 hover:bg-sage">
                <input
                  type="radio"
                  name="availability"
                  checked={(filters.availability || '') === opt.value}
                  onChange={() => onChange({ availability: opt.value })}
                  className="h-4 w-4 border-line text-primary focus:ring-primary/20"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
