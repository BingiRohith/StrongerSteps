'use client';

import { Search } from 'lucide-react';

const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'featured', label: 'Featured first' },
  { value: 'newest', label: 'Newest' },
  { value: 'name-asc', label: 'Name: A-Z' },
];

export default function RecipesToolbar({ searchValue, onSearchChange, sort, onSortChange, total }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <label className="relative w-full sm:max-w-sm">
        <span className="sr-only">Search recipes</span>
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search recipes..."
          className="w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-4 text-sm text-ink focus:border-primary focus:outline-none"
        />
      </label>

      <div className="flex items-center gap-3">
        <p className="text-sm text-muted">{total} {total === 1 ? 'recipe' : 'recipes'}</p>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-primary"
          aria-label="Sort recipes"
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
