'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Ticket, Search, Loader2, Eye, XCircle, MapPin } from 'lucide-react';
import { formatTimeRange } from '@/lib/eventFormat';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'eventDate', label: 'Event date' },
  { value: 'status', label: 'Status' },
];

const STATUS_STYLES = {
  pending: 'bg-accent-soft text-accent-dark',
  confirmed: 'bg-primary-light/20 text-primary-dark',
  cancelled: 'bg-red-50 text-red-700',
  completed: 'bg-ink/10 text-ink',
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
        STATUS_STYLES[status] || STATUS_STYLES.pending
      }`}
    >
      {status}
    </span>
  );
}

export default function BookingsListClient() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [busyId, setBusyId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search.trim()) params.set('search', search.trim());
      params.set('sort', sort);

      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load bookings');
        return;
      }
      setBookings(data.bookings);
    } catch (err) {
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [status, search, sort]);

  useEffect(() => {
    const timeout = setTimeout(loadBookings, search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [loadBookings, search]);

  async function confirmCancel() {
    if (!cancelTarget) return;
    setBusyId(cancelTarget._id);
    try {
      const res = await fetch(`/api/admin/bookings/${cancelTarget._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBookings((prev) => prev.map((b) => (b._id === cancelTarget._id ? data.booking : b)));
      }
    } finally {
      setBusyId(null);
      setCancelTarget(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-primary-dark">
            <Ticket size={18} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-primary-dark">Bookings</h2>
            <p className="text-xs text-muted">
              {bookings.length} booking{bookings.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-64">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, mobile, email, reference…"
              className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-full border border-line bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl2 border border-line bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
            <Loader2 size={18} className="animate-spin" />
            Loading bookings…
          </div>
        ) : error ? (
          <div className="px-6 py-16 text-center text-sm text-red-600">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
              <Ticket size={20} />
            </span>
            <p className="font-display text-sm font-semibold text-ink">No bookings yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              {search || status ? 'No bookings match your current filters.' : 'Bookings will appear here once visitors reserve a seat.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {bookings.map((booking) => (
              <li
                key={booking._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="font-display text-sm font-semibold text-ink">{booking.bookingReference}</p>
                    <StatusBadge status={booking.bookingStatus} />
                  </div>
                  <p className="mt-1 truncate text-sm text-ink">
                    {booking.name} · {booking.mobile} · {booking.email}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    {booking.event ? (
                      <>
                        <span className="font-semibold text-ink">{booking.event.title}</span>
                        <span>
                          {new Date(booking.event.eventDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            timeZone: 'UTC',
                          })}
                          {' · '}
                          {formatTimeRange(booking.event.startTime, booking.event.endTime)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} />
                          {booking.event.location}
                        </span>
                      </>
                    ) : (
                      <span className="italic">Event no longer exists</span>
                    )}
                    <span>1 seat</span>
                    <span className="font-semibold text-ink">
                      {booking.finalAmount ? `₹${booking.finalAmount.toLocaleString('en-IN')}` : 'Free'}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                  {booking.bookingStatus !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => setCancelTarget(booking)}
                      disabled={busyId === booking._id}
                      title="Cancel booking"
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {busyId === booking._id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <XCircle size={16} />
                      )}
                    </button>
                  )}
                  <Link
                    href={`/admin/bookings/${booking._id}`}
                    title="View details"
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage"
                  >
                    <Eye size={16} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4">
          <div className="w-full max-w-sm rounded-xl2 bg-surface p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-primary-dark">Cancel this booking?</h3>
            <p className="mt-2 text-sm text-muted">
              &ldquo;{cancelTarget.bookingReference}&rdquo; for {cancelTarget.name} will be cancelled and the seat
              restored to the event.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted hover:bg-sage"
              >
                Keep booking
              </button>
              <button
                type="button"
                onClick={confirmCancel}
                disabled={busyId === cancelTarget._id}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busyId === cancelTarget._id && <Loader2 size={14} className="animate-spin" />}
                Cancel booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
