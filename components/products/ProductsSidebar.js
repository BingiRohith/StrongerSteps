'use client';

import { X } from 'lucide-react';

/**
 * Filter options are all derived from real data (facets, fetched once by
 * app/products/page.js via lib/publicProducts.js's getProductFilterFacets())
 * — nothing here is hardcoded. Category stays a closed enum by design (see
 * docs/13_DECISIONS.md); "dynamic" means only categories/brands that
 * actually have a published product are shown, not a duplicated list.
 */
export default function ProductsSidebar({ facets, filters, onChange }) {
  const { categories, brands, priceRange } = facets;
  const hasActiveFilters = Boolean(
    filters.category || filters.brand || filters.availability || filters.minPrice || filters.maxPrice
  );

  function clearAll() {
    onChange({ category: '', brand: '', availability: '', minPrice: '', maxPrice: '' });
  }

  return (
    <aside className="h-fit rounded-xl2 border border-line bg-white p-5">
      <div className="flex items-center justify-between">
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

      {categories?.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Category</h3>
          <div className="mt-2 flex flex-col gap-1.5">
            {categories.map((c) => {
              const active = filters.category === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ category: active ? '' : c.value })}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${
                    active ? 'bg-primary text-white' : 'text-ink/80 hover:bg-sage'
                  }`}
                >
                  {c.label}
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
    </aside>
  );
}
