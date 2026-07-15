'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { Badge } from '@/components/ui';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
];

const PAGE_SIZE = 20;

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function BlogsListClient() {
  const [blogs, setBlogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/admin/categories');
        const data = await res.json();
        if (res.ok && data.success) setCategories(data.categories);
      } catch (err) {
        // Non-fatal — the category filter just stays empty.
      }
    }
    loadCategories();
  }, []);

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (category) params.set('category', category);
      if (search.trim()) params.set('search', search.trim());
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));

      const res = await fetch(`/api/admin/blogs?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load blogs');
        return;
      }
      setBlogs(data.blogs);
      setPagination(data.pagination);
    } catch (err) {
      setError('Failed to load blogs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [status, category, search, page]);

  // Any filter change should reset back to page 1.
  useEffect(() => {
    setPage(1);
  }, [status, category, search]);

  useEffect(() => {
    const timeout = setTimeout(loadBlogs, search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [loadBlogs, search]);

  async function toggleStatus(blog) {
    setBusyId(blog._id);
    try {
      const nextStatus = blog.status === 'published' ? 'draft' : 'published';
      const res = await fetch(`/api/admin/blogs/${blog._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBlogs((prev) => prev.map((b) => (b._id === blog._id ? data.blog : b)));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function toggleFeatured(blog) {
    setBusyId(blog._id);
    try {
      const res = await fetch(`/api/admin/blogs/${blog._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !blog.featured }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBlogs((prev) => prev.map((b) => (b._id === blog._id ? data.blog : b)));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget._id);
    try {
      const res = await fetch(`/api/admin/blogs/${deleteTarget._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setBlogs((prev) => prev.filter((b) => b._id !== deleteTarget._id));
        setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      }
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
            <Newspaper size={18} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-primary-dark">Blogs</h2>
            <p className="text-xs text-muted">{pagination.total} article{pagination.total === 1 ? '' : 's'}</p>
          </div>
        </div>
        <Link
          href="/admin/blogs/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
        >
          <Plus size={16} />
          New blog
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-full bg-sage p-1">
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-full border border-line bg-white py-2 pl-3.5 pr-8 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          <div className="relative sm:w-72">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search blogs…"
              className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl2 border border-line bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
            <Loader2 size={18} className="animate-spin" />
            Loading blogs…
          </div>
        ) : error ? (
          <div className="px-6 py-16 text-center text-sm text-red-600">{error}</div>
        ) : blogs.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
              <Newspaper size={20} />
            </span>
            <p className="font-display text-sm font-semibold text-ink">No blogs yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              {search || status || category
                ? 'No blogs match your current filters.'
                : 'Get started by writing your first article.'}
            </p>
            {!search && !status && !category && (
              <Link
                href="/admin/blogs/new"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white hover:bg-primary-dark"
              >
                <Plus size={16} />
                New blog
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {blogs.map((blog) => (
              <li key={blog._id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {blog.coverImage?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={blog.coverImage.url}
                      alt=""
                      className="h-12 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-sage text-primary-dark">
                      <Newspaper size={16} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-ink">{blog.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <StatusBadge status={blog.status} />
                      {blog.featured && (
                        <Badge tone="primary">
                          <Star size={11} className="mr-1 -ml-0.5 fill-current" />
                          Featured
                        </Badge>
                      )}
                      {blog.category?.name && <span>{blog.category.name}</span>}
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {blog.readingTime} min
                      </span>
                      <span>Updated {formatDate(blog.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => toggleFeatured(blog)}
                    disabled={busyId === blog._id}
                    title={blog.featured ? 'Remove from featured' : 'Mark as featured'}
                    className={`rounded-lg p-2 hover:bg-sage disabled:opacity-50 ${
                      blog.featured ? 'text-accent-dark' : 'text-muted'
                    }`}
                  >
                    <Star size={16} className={blog.featured ? 'fill-current' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleStatus(blog)}
                    disabled={busyId === blog._id}
                    title={blog.status === 'published' ? 'Unpublish' : 'Publish'}
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage disabled:opacity-50"
                  >
                    {busyId === blog._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : blog.status === 'published' ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                  <Link
                    href={`/admin/blogs/${blog._id}/edit`}
                    title="Edit"
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(blog)}
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

      {!loading && !error && blogs.length > 0 && pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="inline-flex items-center gap-1 rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold text-primary-dark hover:bg-sage disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={15} />
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={pagination.page >= pagination.pages}
              className="inline-flex items-center gap-1 rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold text-primary-dark hover:bg-sage disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Delete this blog?"
        >
          <div className="w-full max-w-sm rounded-xl2 bg-surface p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-primary-dark">Delete this blog?</h3>
            <p className="mt-2 text-sm text-muted">
              &ldquo;{deleteTarget.title}&rdquo; will be permanently deleted. This can&apos;t be undone.
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
