'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  FileText,
} from 'lucide-react';
import StatusBadge from '@/components/admin/blogs/StatusBadge';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function InfographicsListClient() {
  const [infographics, setInfographics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadInfographics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/infographics?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load infographics');
        return;
      }
      setInfographics(data.infographics);
    } catch (err) {
      setError('Failed to load infographics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const timeout = setTimeout(loadInfographics, search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [loadInfographics, search]);

  async function toggleStatus(infographic) {
    setBusyId(infographic._id);
    try {
      const nextStatus = infographic.status === 'published' ? 'draft' : 'published';
      const res = await fetch(`/api/admin/infographics/${infographic._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInfographics((prev) => prev.map((i) => (i._id === infographic._id ? data.infographic : i)));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget._id);
    try {
      const res = await fetch(`/api/admin/infographics/${deleteTarget._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setInfographics((prev) => prev.filter((i) => i._id !== deleteTarget._id));
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
            <ImageIcon size={18} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-primary-dark">Infographics</h2>
            <p className="text-xs text-muted">
              {infographics.length} infographic{infographics.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <Link
          href="/admin/infographics/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
        >
          <Plus size={16} />
          New infographic
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

        <div className="relative sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search infographics…"
            className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl2 border border-line bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
            <Loader2 size={18} className="animate-spin" />
            Loading infographics…
          </div>
        ) : error ? (
          <div className="px-6 py-16 text-center text-sm text-red-600">{error}</div>
        ) : infographics.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
              <ImageIcon size={20} />
            </span>
            <p className="font-display text-sm font-semibold text-ink">No infographics yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              {search || status
                ? 'No infographics match your current filters.'
                : 'Get started by adding your first infographic.'}
            </p>
            {!search && !status && (
              <Link
                href="/admin/infographics/new"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white hover:bg-primary-dark"
              >
                <Plus size={16} />
                New infographic
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {infographics.map((infographic) => (
              <li
                key={infographic._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {infographic.thumbnailImage?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={infographic.thumbnailImage.url}
                      alt=""
                      className="h-12 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-sage text-primary-dark">
                      <ImageIcon size={16} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-ink">{infographic.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <StatusBadge status={infographic.status} />
                      {infographic.category && <span>{infographic.category}</span>}
                      {infographic.pdf?.url && (
                        <span className="inline-flex items-center gap-1">
                          <FileText size={12} />
                          PDF
                        </span>
                      )}
                      <span>Updated {formatDate(infographic.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => toggleStatus(infographic)}
                    disabled={busyId === infographic._id}
                    title={infographic.status === 'published' ? 'Unpublish' : 'Publish'}
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage disabled:opacity-50"
                  >
                    {busyId === infographic._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : infographic.status === 'published' ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                  <Link
                    href={`/admin/infographics/${infographic._id}/edit`}
                    title="Edit"
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(infographic)}
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
          aria-label="Delete this infographic?"
        >
          <div className="w-full max-w-sm rounded-xl2 bg-surface p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-primary-dark">Delete this infographic?</h3>
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
