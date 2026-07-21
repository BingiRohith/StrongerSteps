'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FolderTree,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

// Mirrors components/admin/course-categories/CourseCategoriesListClient.js
// exactly (same list/filter/reorder/toggle/delete pattern), pointed at the
// Resource Categories admin API.
const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export default function ResourceCategoriesListClient() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isActive, setIsActive] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (isActive) params.set('isActive', isActive);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/resource-categories?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load categories');
        return;
      }
      setCategories(data.categories);
    } catch (err) {
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isActive, search]);

  useEffect(() => {
    const timeout = setTimeout(loadCategories, search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [loadCategories, search]);

  async function updateCategory(id, body) {
    const res = await fetch(`/api/admin/resource-categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok && data.success) return data.category;
    return null;
  }

  async function toggleActive(category) {
    setBusyId(category._id);
    try {
      const res = await fetch(`/api/admin/resource-categories/${category._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !category.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCategories((prev) => prev.map((c) => (c._id === category._id ? data.category : c)));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function move(category, direction) {
    const sorted = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = sorted.findIndex((c) => c._id === category._id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const neighbor = sorted[targetIndex];

    setBusyId(category._id);
    try {
      const [updated, updatedNeighbor] = await Promise.all([
        updateCategory(category._id, { displayOrder: neighbor.displayOrder }),
        updateCategory(neighbor._id, { displayOrder: category.displayOrder }),
      ]);
      if (updated && updatedNeighbor) {
        setCategories((prev) =>
          prev.map((c) => {
            if (c._id === updated._id) return updated;
            if (c._id === updatedNeighbor._id) return updatedNeighbor;
            return c;
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
      const res = await fetch(`/api/admin/resource-categories/${deleteTarget._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setCategories((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      } else {
        setError(data.error || 'Failed to delete category');
      }
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  }

  const sortedCategories = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-primary-dark">
            <FolderTree size={18} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-primary-dark">Resource Categories</h2>
            <p className="text-xs text-muted">
              {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
            </p>
          </div>
        </div>
        <Link
          href="/admin/resource-categories/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
        >
          <Plus size={16} />
          New category
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-full bg-sage p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setIsActive(tab.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                isActive === tab.value
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
            placeholder="Search categories…"
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
        ) : error ? (
          <div className="px-6 py-16 text-center text-sm text-red-600">{error}</div>
        ) : sortedCategories.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
              <FolderTree size={20} />
            </span>
            <p className="font-display text-sm font-semibold text-ink">No categories yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              {search || isActive
                ? 'No categories match your current filters.'
                : 'Get started by adding your first resource category.'}
            </p>
            {!search && !isActive && (
              <Link
                href="/admin/resource-categories/new"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white hover:bg-primary-dark"
              >
                <Plus size={16} />
                New category
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {sortedCategories.map((category, index) => (
              <li
                key={category._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {category.icon?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={category.icon.url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-sage text-primary-dark">
                      <FolderTree size={16} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-ink">{category.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                          category.isActive ? 'bg-primary-light/20 text-primary-dark' : 'bg-accent-soft text-accent-dark'
                        }`}
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span>/{category.slug}</span>
                      <span>Order {category.displayOrder}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => move(category, -1)}
                    disabled={busyId === category._id || index === 0}
                    title="Move up"
                    className="rounded-lg p-2 text-muted hover:bg-sage disabled:opacity-30"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(category, 1)}
                    disabled={busyId === category._id || index === sortedCategories.length - 1}
                    title="Move down"
                    className="rounded-lg p-2 text-muted hover:bg-sage disabled:opacity-30"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(category)}
                    disabled={busyId === category._id}
                    title={category.isActive ? 'Deactivate' : 'Activate'}
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage disabled:opacity-50"
                  >
                    {busyId === category._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : category.isActive ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                  <Link
                    href={`/admin/resource-categories/${category._id}/edit`}
                    title="Edit"
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(category)}
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

      {error && !loading && categories.length > 0 && (
        <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Delete this category?"
        >
          <div className="w-full max-w-sm rounded-xl2 bg-surface p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-primary-dark">Delete this category?</h3>
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
