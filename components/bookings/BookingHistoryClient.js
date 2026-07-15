'use client';

import { useState } from 'react';
import { Search, Loader2, AlertCircle, ChevronDown, MapPin, Calendar as CalendarIcon, Ticket } from 'lucide-react';
import { isValidMobile } from '@/lib/eventValidation';
import { formatTimeRange } from '@/lib/eventFormat';

const STATUS_STYLES = {
  pending: 'bg-accent-soft text-accent-dark',
  confirmed: 'bg-primary-light/20 text-primary-dark',
  cancelled: 'bg-red-50 text-red-700',
  completed: 'bg-sage text-primary-dark',
};

function formatAmount(amount) {
  if (!amount) return 'Free';
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function BookingHistoryClient() {
  const [mobile, setMobile] = useState('');
  const [reference, setReference] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [apiError, setApiError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');

    if (!isValidMobile(mobile)) {
      setErrors({ mobile: 'Enter a valid 10-digit mobile number' });
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const params = new URLSearchParams({ mobile: mobile.trim() });
      if (reference.trim()) params.set('reference', reference.trim());

      const res = await fetch(`/api/bookings/lookup?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setApiError(data.error || 'Something went wrong. Please try again.');
        setBookings([]);
      } else {
        setBookings(data.bookings);
        setExpandedId(null);
      }
    } catch (err) {
      setApiError('Something went wrong. Please try again.');
      setBookings([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-xl2 border border-line bg-white p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div>
          <label className="block text-sm font-semibold text-ink" htmlFor="lookup-mobile">
            Mobile number
          </label>
          <input
            id="lookup-mobile"
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="9876543210"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.mobile && <p className="mt-1 text-xs font-semibold text-red-600">{errors.mobile}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink" htmlFor="lookup-reference">
            Booking reference <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="lookup-reference"
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="SS-20260715-0001"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Find bookings
        </button>
      </form>

      {apiError && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {searched && !apiError && (
        <div className="mt-8">
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl2 border border-line bg-white px-6 py-14 text-center">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
                <Ticket size={20} aria-hidden="true" />
              </span>
              <p className="font-display text-sm font-semibold text-ink">No bookings found</p>
              <p className="mt-1 max-w-xs text-sm text-muted">
                Double-check the mobile number and reference, then try again.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {bookings.map((booking) => {
                const expanded = expandedId === booking._id;
                return (
                  <li key={booking._id} className="overflow-hidden rounded-xl2 border border-line bg-white">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : booking._id)}
                      className="flex w-full flex-col gap-2 px-5 py-4 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      aria-expanded={expanded}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-display text-sm font-semibold text-ink">
                            {booking.bookingReference}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                              STATUS_STYLES[booking.bookingStatus] || STATUS_STYLES.pending
                            }`}
                          >
                            {booking.bookingStatus}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm text-muted">
                          {booking.event ? booking.event.title : 'Event no longer available'} ·{' '}
                          {formatDate(booking.event?.eventDate)} · 1 seat
                        </p>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {expanded && (
                      <div className="border-t border-line bg-sage/30 px-5 py-4">
                        {booking.event && (
                          <div className="space-y-2 text-sm text-ink">
                            <div className="flex items-center gap-2">
                              <CalendarIcon size={15} className="text-muted" />
                              {formatDate(booking.event.eventDate)} ·{' '}
                              {formatTimeRange(booking.event.startTime, booking.event.endTime)}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin size={15} className="text-muted" />
                              {booking.event.location}
                            </div>
                          </div>
                        )}
                        <dl className="mt-3 space-y-1.5 text-sm">
                          <div className="flex justify-between gap-3">
                            <dt className="text-muted">Booked for</dt>
                            <dd className="font-semibold text-ink">{booking.name}</dd>
                          </div>
                          <div className="flex justify-between gap-3 border-t border-line/60 pt-1.5">
                            <dt className="text-muted">Amount</dt>
                            <dd className="font-display font-bold text-primary-dark">
                              {formatAmount(booking.finalAmount)}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
