'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Library,
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
  Files,
} from 'lucide-react';
import StatusBadge from '@/components/admin/blogs/StatusBadge';

// Mirrors components/admin/courses/CoursesListClient.js's list/filter/
// reorder/toggle/delete pattern, pointed at the Resources admin API.
// `DELETE` here soft-deletes (see app/api/admin/resources/[id]/route.js) —
// the row simply disappears from this list, same UX as Courses' hard
// delete from the admin's point of view.
const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
];

export default function ResourcesListClient() {
  const [resources, setResources] = useState([]);
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
      const res = await fetch('/api/admin/resource-categories');
      const data = await res.json();
      if (res.ok && data.success) setCategories(data.categories);
    })();
  }, []);

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (category) params.set('category', category);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/resources?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load resources');
        return;
      }
      setResources(data.resources);
    } catch (err) {
      setError('Failed to load resources. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [status, category, search]);

  useEffect(() => {
    const timeout = setTimeout(loadResources, search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [loadResources, search]);

  async function updateResource(id, body) {
    const res = await fetch(`/api/admin/resources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok && data.success) return data.resource;
    return null;
  }

  async function toggleFeatured(resource) {
    setBusyId(resource._id);
    try {
      const updated = await updateResource(resource._id, { featured: !resource.featured });
      if (updated) setResources((prev) => prev.map((r) => (r._id === resource._id ? updated : r)));
    } finally {
      setBusyId(null);
    }
  }

  async function toggleStatus(resource) {
    setBusyId(resource._id);
    try {
      const nextStatus = resource.status === 'published' ? 'draft' : 'published';
      const res = await fetch(`/api/admin/resources/${resource._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResources((prev) => prev.map((r) => (r._id === resource._id ? data.resource : r)));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function move(resource, direction) {
    const sorted = [...resources].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = sorted.findIndex((r) => r._id === resource._id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const neighbor = sorted[targetIndex];

    setBusyId(resource._id);
    try {
      const [updated, updatedNeighbor] = await Promise.all([
        updateResource(resource._id, { displayOrder: neighbor.displayOrder }),
        updateResource(neighbor._id, { displayOrder: resource.displayOrder }),
      ]);
      if (updated && updatedNeighbor) {
        setResources((prev) =>
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
      const res = await fetch(`/api/admin/resources/${deleteTarget._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setResources((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      }
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  }

  const sortedResources = [...resources].sort((a, b) => a.displayOrder - b.displayOrder);
  const categoryTabs = [{ _id: '', name: 'All categories' }, ...categories];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-primary-dark">
            <Library size={18} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-primary-dark">Resources</h2>
            <p className="text-xs text-muted">
              {resources.length} resource{resources.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <Link
          href="/admin/resources/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
        >
          <Plus size={16} />
          New resource
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
            placeholder="Search resources…"
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
            Loading resources…
          </div>
        ) : error ? (
          <div className="px-6 py-16 text-center text-sm text-red-600">{error}</div>
        ) : sortedResources.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
              <Library size={20} />
            </span>
            <p className="font-display text-sm font-semibold text-ink">No resources yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              {search || status || category
                ? 'No resources match your current filters.'
                : 'Get started by adding your first resource.'}
            </p>
            {!search && !status && !category && (
              <Link
                href="/admin/resources/new"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white hover:bg-primary-dark"
              >
                <Plus size={16} />
                New resource
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {sortedResources.map((resource, index) => (
              <li
                key={resource._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {resource.thumbnail?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resource.thumbnail.url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-sage text-primary-dark">
                      <Library size={16} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-ink">{resource.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <StatusBadge status={resource.status} />
                      <span>{resource.category?.name || 'Uncategorized'}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-sage px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-dark">
                        {resource.accessLevel}
                      </span>
                      {resource.fileTypes?.length > 0 && (
                        <span>
                          {resource.fileTypes.length} file type{resource.fileTypes.length === 1 ? '' : 's'}
                        </span>
                      )}
                      <span>Order {resource.displayOrder}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => move(resource, -1)}
                    disabled={busyId === resource._id || index === 0}
                    title="Move up"
                    className="rounded-lg p-2 text-muted hover:bg-sage disabled:opacity-30"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(resource, 1)}
                    disabled={busyId === resource._id || index === sortedResources.length - 1}
                    title="Move down"
                    className="rounded-lg p-2 text-muted hover:bg-sage disabled:opacity-30"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFeatured(resource)}
                    disabled={busyId === resource._id}
                    title={resource.featured ? 'Remove from featured' : 'Mark as featured'}
                    className={`rounded-lg p-2 hover:bg-sage disabled:opacity-50 ${
                      resource.featured ? 'text-accent-dark' : 'text-muted'
                    }`}
                  >
                    <Star size={16} className={resource.featured ? 'fill-current' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleStatus(resource)}
                    disabled={busyId === resource._id}
                    title={resource.status === 'published' ? 'Unpublish' : 'Publish'}
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage disabled:opacity-50"
                  >
                    {busyId === resource._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : resource.status === 'published' ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                  <Link
                    href={`/admin/resources/${resource._id}/files`}
                    title="Files"
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage"
                  >
                    <Files size={16} />
                  </Link>
                  <Link
                    href={`/admin/resources/${resource._id}/edit`}
                    title="Edit"
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(resource)}
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
          aria-label="Delete this resource?"
        >
          <div className="w-full max-w-sm rounded-xl2 bg-surface p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-primary-dark">Delete this resource?</h3>
            <p className="mt-2 text-sm text-muted">
              &ldquo;{deleteTarget.title}&rdquo; and its files will be removed from the site. This is
              reversible from the database if needed, but not from this screen.
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
