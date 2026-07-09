'use client';

import { X } from 'lucide-react';
import { DIFFICULTY_LEVELS } from '@/lib/recipeOptions';

/**
 * Tag/difficulty filters — Category has its own prominent navigation
 * (CategoryNav.js), so this sidebar covers the remaining filterable fields
 * per the CRS ("search by Recipe Name, Category, Tags, Difficulty"). Tags
 * are real distinct values from published recipes (facets.tags), never
 * hardcoded — same "dynamic" principle as components/products/ProductsSidebar.js.
 */
export default function RecipesSidebar({ facets, filters, onChange }) {
  const { tags } = facets;
  const hasActiveFilters = Boolean(filters.tag || filters.difficulty);

  function clearAll() {
    onChange({ tag: '', difficulty: '' });
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

      <div className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Difficulty</h3>
        <div className="mt-2 flex flex-col gap-1.5">
          {[{ value: '', label: 'All' }, ...DIFFICULTY_LEVELS].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-ink/80 hover:bg-sage">
              <input
                type="radio"
                name="difficulty"
                checked={(filters.difficulty || '') === opt.value}
                onChange={() => onChange({ difficulty: opt.value })}
                className="h-4 w-4 border-line text-primary focus:ring-primary/20"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {tags?.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Tags</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => {
              const active = filters.tag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ tag: active ? '' : tag })}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                    active ? 'bg-primary text-white' : 'border border-line text-ink/80 hover:border-primary'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
