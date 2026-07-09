'use client';

import { Search } from 'lucide-react';

const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'featured', label: 'Featured first' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'newest', label: 'Newest' },
];

export default function ProductsToolbar({ searchValue, onSearchChange, sort, onSortChange, total }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <label className="relative w-full sm:max-w-sm">
        <span className="sr-only">Search products</span>
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products..."
          className="w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-4 text-sm text-ink focus:border-primary focus:outline-none"
        />
      </label>

      <div className="flex items-center gap-3">
        <p className="text-sm text-muted">{total} {total === 1 ? 'product' : 'products'}</p>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-primary"
          aria-label="Sort products"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
