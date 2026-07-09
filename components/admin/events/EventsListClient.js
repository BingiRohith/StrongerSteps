'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
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
  MapPin,
} from 'lucide-react';
import { formatTimeRange } from '@/lib/eventFormat';

function EventStatusBadge({ status }) {
  const isPublished = status === 'published';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
        isPublished ? 'bg-primary-light/20 text-primary-dark' : 'bg-accent-soft text-accent-dark'
      }`}
    >
      {isPublished ? 'Published' : 'Draft'}
    </span>
  );
}

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];

export default function EventsListClient() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/events?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load events');
        return;
      }
      setEvents(data.events);
    } catch (err) {
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const timeout = setTimeout(loadEvents, search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [loadEvents, search]);

  async function updateEvent(id, body) {
    const res = await fetch(`/api/admin/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok && data.success) return data.event;
    return null;
  }

  async function toggleFeatured(event) {
    setBusyId(event._id);
    try {
      const updated = await updateEvent(event._id, { featured: !event.featured });
      if (updated) setEvents((prev) => prev.map((e) => (e._id === event._id ? updated : e)));
    } finally {
      setBusyId(null);
    }
  }

  async function toggleStatus(event) {
    setBusyId(event._id);
    try {
      const nextStatus = event.status === 'published' ? 'draft' : 'published';
      const res = await fetch(`/api/admin/events/${event._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEvents((prev) => prev.map((e) => (e._id === event._id ? data.event : e)));
      }
    } finally {
      setBusyId(null);
    }
  }

  // Reorder swaps displayOrder between two adjacent (by displayOrder)
  // events via the existing PUT endpoint — same approach as
  // MembershipListClient.js, no dedicated reorder API needed.
  async function move(event, direction) {
    const sorted = [...events].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = sorted.findIndex((e) => e._id === event._id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const neighbor = sorted[targetIndex];

    setBusyId(event._id);
    try {
      const [updatedEvent, updatedNeighbor] = await Promise.all([
        updateEvent(event._id, { displayOrder: neighbor.displayOrder }),
        updateEvent(neighbor._id, { displayOrder: event.displayOrder }),
      ]);
      if (updatedEvent && updatedNeighbor) {
        setEvents((prev) =>
          prev.map((e) => {
            if (e._id === updatedEvent._id) return updatedEvent;
            if (e._id === updatedNeighbor._id) return updatedNeighbor;
            return e;
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
      const res = await fetch(`/api/admin/events/${deleteTarget._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setEvents((prev) => prev.filter((e) => e._id !== deleteTarget._id));
      }
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  }

  const sortedEvents = [...events].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-primary-dark">
            <Calendar size={18} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-primary-dark">Programs</h2>
            <p className="text-xs text-muted">
              {events.length} event{events.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
        >
          <Plus size={16} />
          New event
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
            placeholder="Search events…"
            className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl2 border border-line bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
            <Loader2 size={18} className="animate-spin" />
            Loading events…
          </div>
        ) : error ? (
          <div className="px-6 py-16 text-center text-sm text-red-600">{error}</div>
        ) : sortedEvents.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
              <Calendar size={20} />
            </span>
            <p className="font-display text-sm font-semibold text-ink">No events yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              {search || status
                ? 'No events match your current filters.'
                : 'Get started by adding your first event.'}
            </p>
            {!search && !status && (
              <Link
                href="/admin/events/new"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white hover:bg-primary-dark"
              >
                <Plus size={16} />
                New event
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {sortedEvents.map((event, index) => (
              <li
                key={event._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {event.image?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.image.url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-sage text-primary-dark">
                      <Calendar size={16} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-ink">{event.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <EventStatusBadge status={event.status} />
                      <span>
                        {new Date(event.eventDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          timeZone: 'UTC',
                        })}
                        {' · '}
                        {formatTimeRange(event.startTime, event.endTime)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} />
                        {event.location}
                      </span>
                      <span className="font-semibold text-ink">
                        {event.availableSeats}/{event.maxSeats} seats
                      </span>
                      <span>Order {event.displayOrder}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => move(event, -1)}
                    disabled={busyId === event._id || index === 0}
                    title="Move up"
                    className="rounded-lg p-2 text-muted hover:bg-sage disabled:opacity-30"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(event, 1)}
                    disabled={busyId === event._id || index === sortedEvents.length - 1}
                    title="Move down"
                    className="rounded-lg p-2 text-muted hover:bg-sage disabled:opacity-30"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFeatured(event)}
                    disabled={busyId === event._id}
                    title={event.featured ? 'Remove from featured' : 'Mark as featured'}
                    className={`rounded-lg p-2 hover:bg-sage disabled:opacity-50 ${
                      event.featured ? 'text-accent-dark' : 'text-muted'
                    }`}
                  >
                    <Star size={16} className={event.featured ? 'fill-current' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleStatus(event)}
                    disabled={busyId === event._id}
                    title={event.status === 'published' ? 'Unpublish' : 'Publish'}
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage disabled:opacity-50"
                  >
                    {busyId === event._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : event.status === 'published' ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                  <Link
                    href={`/admin/events/${event._id}/edit`}
                    title="Edit"
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(event)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4">
          <div className="w-full max-w-sm rounded-xl2 bg-surface p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-primary-dark">Delete this event?</h3>
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
