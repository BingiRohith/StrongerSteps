'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FolderTree, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';

/** Blog-category list with search and protected deletion. */
export default function CategoriesListClient() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/categories?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load categories');
        return;
      }
      setCategories(data.categories);
    } catch {
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(loadCategories, search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [loadCategories, search]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget._id);
    setError('');
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setCategories((current) => current.filter((item) => item._id !== deleteTarget._id));
      } else {
        setError(data.error || 'Failed to delete category');
      }
    } catch {
      setError('Failed to delete category. Please try again.');
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-primary-dark">
            <FolderTree size={18} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-primary-dark">Blog Categories</h2>
            <p className="text-xs text-muted">
              {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
            </p>
          </div>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
        >
          <Plus size={16} />
          New category
        </Link>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search blog categories…"
            className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl2 border border-line bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
            <Loader2 size={18} className="animate-spin" />
            Loading categories…
          </div>
        ) : error && categories.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-red-600">{error}</div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
              <FolderTree size={20} />
            </span>
            <p className="font-display text-sm font-semibold text-ink">No categories found</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              {search ? 'No categories match your search.' : 'Add a category before publishing your first blog.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {categories.map((category) => (
              <li key={category._id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sage text-primary-dark">
                  <FolderTree size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-ink">{category.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">/{category.slug}</p>
                  {category.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{category.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Link
                    href={`/admin/categories/${category._id}/edit`}
                    title="Edit category"
                    aria-label={`Edit ${category.name}`}
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(category)}
                    title="Delete category"
                    aria-label={`Delete ${category.name}`}
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

      {error && categories.length > 0 && (
        <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4" role="dialog" aria-modal="true" aria-labelledby="delete-category-title">
          <div className="w-full max-w-sm rounded-xl2 bg-surface p-6 shadow-xl">
            <h3 id="delete-category-title" className="font-display text-lg font-bold text-primary-dark">
              Delete this category?
            </h3>
            <p className="mt-2 text-sm text-muted">
              &ldquo;{deleteTarget.name}&rdquo; will be permanently deleted. Categories still used by a blog cannot be deleted.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted hover:bg-sage">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} disabled={busyId === deleteTarget._id} className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
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
