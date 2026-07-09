'use client';

/**
 * Prominent Category Navigation — the CRS lists this as a distinct
 * requirement from the sidebar Filters (RecipesSidebar.js). Reflects the
 * admin-curated, ordered set of active categories directly (see
 * lib/publicRecipes.js's getActiveRecipeCategories()), not a derived facet.
 */
export default function CategoryNav({ categories, activeSlug, onChange }) {
  if (!categories || categories.length === 0) return null;

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Recipe categories">
      <button
        type="button"
        aria-pressed={!activeSlug}
        onClick={() => onChange('')}
        className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          !activeSlug ? 'bg-primary text-white' : 'border border-line bg-white text-primary-dark hover:border-primary'
        }`}
      >
        All Recipes
      </button>
      {categories.map((cat) => {
        const active = activeSlug === cat.slug;
        return (
          <button
            key={cat._id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? '' : cat.slug)}
            className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active ? 'bg-primary text-white' : 'border border-line bg-white text-primary-dark hover:border-primary'
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </nav>
  );
}
