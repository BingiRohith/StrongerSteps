'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Star,
  ArrowUp,
  ArrowDown,
  Move,
} from 'lucide-react';
import StatusBadge from '@/components/admin/blogs/StatusBadge';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
];

/** Siblings = members sharing the same parent (or all root members), ordered by displayOrder — "Reorder Children" swaps displayOrder within this subset only. */
function getSiblingIds(teamMembers, teamMember) {
  const parentId = teamMember.parentMember?._id || teamMember.parentMember || null;
  return teamMembers
    .filter((m) => (m.parentMember?._id || m.parentMember || null) === parentId)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((m) => m._id);
}

export default function TeamListClient() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadTeamMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/team?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load team members');
        return;
      }
      setTeamMembers(data.teamMembers);
    } catch (err) {
      setError('Failed to load team members. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const timeout = setTimeout(loadTeamMembers, search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [loadTeamMembers, search]);

  async function toggleStatus(teamMember) {
    setBusyId(teamMember._id);
    try {
      const nextStatus = teamMember.status === 'published' ? 'draft' : 'published';
      const res = await fetch(`/api/admin/team/${teamMember._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTeamMembers((prev) => prev.map((t) => (t._id === teamMember._id ? data.teamMember : t)));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function toggleFeatured(teamMember) {
    setBusyId(teamMember._id);
    try {
      const res = await fetch(`/api/admin/team/${teamMember._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !teamMember.featured }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTeamMembers((prev) => prev.map((t) => (t._id === teamMember._id ? data.teamMember : t)));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function updateTeamMember(id, body) {
    const res = await fetch(`/api/admin/team/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok && data.success) return data.teamMember;
    return null;
  }

  // Reorder Children (CRS §11 / Sprint 14): swap displayOrder with the
  // adjacent sibling only — i.e. another member reporting to the same
  // parent (or another root member) — not the whole, mixed-hierarchy list.
  async function moveSibling(teamMember, direction) {
    const siblingIds = getSiblingIds(teamMembers, teamMember);
    const index = siblingIds.indexOf(teamMember._id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= siblingIds.length) return;
    const neighbor = teamMembers.find((m) => m._id === siblingIds[targetIndex]);
    if (!neighbor) return;

    setBusyId(teamMember._id);
    try {
      const [updated, updatedNeighbor] = await Promise.all([
        updateTeamMember(teamMember._id, { displayOrder: neighbor.displayOrder }),
        updateTeamMember(neighbor._id, { displayOrder: teamMember.displayOrder }),
      ]);
      if (updated && updatedNeighbor) {
        setTeamMembers((prev) =>
          prev.map((t) => {
            if (t._id === updated._id) return updated;
            if (t._id === updatedNeighbor._id) return updatedNeighbor;
            return t;
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
      const res = await fetch(`/api/admin/team/${deleteTarget._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setTeamMembers((prev) => prev.filter((t) => t._id !== deleteTarget._id));
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
            <Users size={18} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-primary-dark">Team</h2>
            <p className="text-xs text-muted">
              {teamMembers.length} team member{teamMembers.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/team/tree"
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary px-5 py-2.5 font-display text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary hover:text-white"
          >
            <Move size={16} />
            Tree layout
          </Link>
          <Link
            href="/admin/team/new"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
          >
            <Plus size={16} />
            New team member
          </Link>
        </div>
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
            placeholder="Search team members…"
            className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl2 border border-line bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
            <Loader2 size={18} className="animate-spin" />
            Loading team members…
          </div>
        ) : error ? (
          <div className="px-6 py-16 text-center text-sm text-red-600">{error}</div>
        ) : teamMembers.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
              <Users size={20} />
            </span>
            <p className="font-display text-sm font-semibold text-ink">No team members yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              {search || status
                ? 'No team members match your current filters.'
                : 'Get started by adding your first team member.'}
            </p>
            {!search && !status && (
              <Link
                href="/admin/team/new"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white hover:bg-primary-dark"
              >
                <Plus size={16} />
                New team member
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {teamMembers.map((teamMember) => (
              <li
                key={teamMember._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {teamMember.photo?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={teamMember.photo.url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage text-primary-dark">
                      <Users size={16} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-ink">{teamMember.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <StatusBadge status={teamMember.status} />
                      {teamMember.designation && <span>{teamMember.designation}</span>}
                      {teamMember.department && <span>{teamMember.department}</span>}
                      <span>
                        {teamMember.parentMember?.name
                          ? `Parent: ${teamMember.parentMember.name}`
                          : 'Root of tree'}
                      </span>
                      <span>Order {teamMember.displayOrder}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => moveSibling(teamMember, -1)}
                    disabled={busyId === teamMember._id}
                    title="Move up (within siblings)"
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage disabled:opacity-50"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSibling(teamMember, 1)}
                    disabled={busyId === teamMember._id}
                    title="Move down (within siblings)"
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage disabled:opacity-50"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFeatured(teamMember)}
                    disabled={busyId === teamMember._id}
                    title={teamMember.featured ? 'Remove from featured' : 'Mark as featured'}
                    className={`rounded-lg p-2 hover:bg-sage disabled:opacity-50 ${
                      teamMember.featured ? 'text-accent-dark' : 'text-muted'
                    }`}
                  >
                    <Star size={16} className={teamMember.featured ? 'fill-current' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleStatus(teamMember)}
                    disabled={busyId === teamMember._id}
                    title={teamMember.status === 'published' ? 'Unpublish' : 'Publish'}
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage disabled:opacity-50"
                  >
                    {busyId === teamMember._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : teamMember.status === 'published' ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                  <Link
                    href={`/admin/team/${teamMember._id}/edit`}
                    title="Edit"
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(teamMember)}
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
          aria-label="Delete this team member?"
        >
          <div className="w-full max-w-sm rounded-xl2 bg-surface p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-primary-dark">Delete this team member?</h3>
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
