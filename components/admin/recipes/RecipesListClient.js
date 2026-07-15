'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Soup,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Star,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import StatusBadge from '@/components/admin/blogs/StatusBadge';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
];

export default function RecipesListClient() {
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/recipe-categories');
      const data = await res.json();
      if (res.ok && data.success) setCategories(data.categories);
    })();
  }, []);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (category) params.set('category', category);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/recipes?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load recipes');
        return;
      }
      setRecipes(data.recipes);
    } catch (err) {
      setError('Failed to load recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [status, category, search]);

  useEffect(() => {
    const timeout = setTimeout(loadRecipes, search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [loadRecipes, search]);

  async function updateRecipe(id, body) {
    const res = await fetch(`/api/admin/recipes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok && data.success) return data.recipe;
    return null;
  }

  async function toggleFeatured(recipe) {
    setBusyId(recipe._id);
    try {
      const updated = await updateRecipe(recipe._id, { featured: !recipe.featured });
      if (updated) setRecipes((prev) => prev.map((r) => (r._id === recipe._id ? updated : r)));
    } finally {
      setBusyId(null);
    }
  }

  async function toggleStatus(recipe) {
    setBusyId(recipe._id);
    try {
      const nextStatus = recipe.status === 'published' ? 'draft' : 'published';
      const res = await fetch(`/api/admin/recipes/${recipe._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecipes((prev) => prev.map((r) => (r._id === recipe._id ? data.recipe : r)));
      }
    } finally {
      setBusyId(null);
    }
  }

  // Reorder only makes sense against the unfiltered, displayOrder-sorted
  // list within the currently loaded set — same swap-two-adjacent pattern
  // as components/admin/membership/MembershipListClient.js.
  async function move(recipe, direction) {
    const sorted = [...recipes].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = sorted.findIndex((r) => r._id === recipe._id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const neighbor = sorted[targetIndex];

    setBusyId(recipe._id);
    try {
      const [updated, updatedNeighbor] = await Promise.all([
        updateRecipe(recipe._id, { displayOrder: neighbor.displayOrder }),
        updateRecipe(neighbor._id, { displayOrder: recipe.displayOrder }),
      ]);
      if (updated && updatedNeighbor) {
        setRecipes((prev) =>
          prev.map((r) => {
            if (r._id === updated._id) return updated;
            if (r._id === updatedNeighbor._id) return updatedNeighbor;
            return r;
          })
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget._id);
    try {
      const res = await fetch(`/api/admin/recipes/${deleteTarget._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecipes((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      }
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  }

  const sortedRecipes = [...recipes].sort((a, b) => a.displayOrder - b.displayOrder);
  const categoryTabs = [{ _id: '', name: 'All categories' }, ...categories];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-primary-dark">
            <Soup size={18} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-primary-dark">Recipes</h2>
            <p className="text-xs text-muted">
              {recipes.length} recipe{recipes.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <Link
          href="/admin/recipes/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
        >
          <Plus size={16} />
          New recipe
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-full bg-sage p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                status === tab.value
                  ? 'bg-primary-dark text-white'
                  : 'text-primary-dark/70 hover:text-primary-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes…"
            className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {categoryTabs.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categoryTabs.map((tab) => (
            <button
              key={tab._id}
              type="button"
              onClick={() => setCategory(tab._id)}
              className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors ${
                category === tab._id
                  ? 'border-primary bg-primary text-white'
                  : 'border-line text-muted hover:border-primary hover:text-primary'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl2 border border-line bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
            <Loader2 size={18} className="animate-spin" />
            Loading recipes…
          </div>
        ) : error ? (
          <div className="px-6 py-16 text-center text-sm text-red-600">{error}</div>
        ) : sortedRecipes.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
              <Soup size={20} />
            </span>
            <p className="font-display text-sm font-semibold text-ink">No recipes yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              {search || status || category
                ? 'No recipes match your current filters.'
                : 'Get started by adding your first recipe.'}
            </p>
            {!search && !status && !category && (
              <Link
                href="/admin/recipes/new"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white hover:bg-primary-dark"
              >
                <Plus size={16} />
                New recipe
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {sortedRecipes.map((recipe, index) => (
              <li
                key={recipe._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {recipe.featuredImage?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={recipe.featuredImage.url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-sage text-primary-dark">
                      <Soup size={16} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-ink">{recipe.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <StatusBadge status={recipe.status} />
                      <span>{recipe.category?.name || 'Uncategorized'}</span>
                      <span>{recipe.difficulty}</span>
                      <span>Order {recipe.displayOrder}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => move(recipe, -1)}
                    disabled={busyId === recipe._id || index === 0}
                    title="Move up"
                    className="rounded-lg p-2 text-muted hover:bg-sage disabled:opacity-30"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(recipe, 1)}
                    disabled={busyId === recipe._id || index === sortedRecipes.length - 1}
                    title="Move down"
                    className="rounded-lg p-2 text-muted hover:bg-sage disabled:opacity-30"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFeatured(recipe)}
                    disabled={busyId === recipe._id}
                    title={recipe.featured ? 'Remove from featured' : 'Mark as featured'}
                    className={`rounded-lg p-2 hover:bg-sage disabled:opacity-50 ${
                      recipe.featured ? 'text-accent-dark' : 'text-muted'
                    }`}
                  >
                    <Star size={16} className={recipe.featured ? 'fill-current' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleStatus(recipe)}
                    disabled={busyId === recipe._id}
                    title={recipe.status === 'published' ? 'Unpublish' : 'Publish'}
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage disabled:opacity-50"
                  >
                    {busyId === recipe._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : recipe.status === 'published' ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                  <Link
                    href={`/admin/recipes/${recipe._id}/edit`}
                    title="Edit"
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(recipe)}
                    title="Delete"
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Delete this recipe?"
        >
          <div className="w-full max-w-sm rounded-xl2 bg-surface p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-primary-dark">Delete this recipe?</h3>
            <p className="mt-2 text-sm text-muted">
              &ldquo;{deleteTarget.name}&rdquo; will be permanently deleted. This can&apos;t be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted hover:bg-sage"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busyId === deleteTarget._id}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busyId === deleteTarget._id && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
