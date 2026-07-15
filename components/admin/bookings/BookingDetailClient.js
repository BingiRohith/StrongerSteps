'use client';

import { useState } from 'react';
import { Loader2, MapPin, Calendar, User, Phone, Mail, XCircle } from 'lucide-react';
import { formatTimeRange } from '@/lib/eventFormat';

const STATUS_OPTIONS = ['pending', 'confirmed', 'cancelled', 'completed'];

const STATUS_STYLES = {
  pending: 'bg-accent-soft text-accent-dark',
  confirmed: 'bg-primary-light/20 text-primary-dark',
  cancelled: 'bg-red-50 text-red-700',
  completed: 'bg-ink/10 text-ink',
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

export default function BookingDetailClient({ initialBooking }) {
  const [booking, setBooking] = useState(initialBooking);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function changeStatus(nextStatus) {
    if (nextStatus === booking.bookingStatus || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/bookings/${booking._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Could not update booking status');
        return;
      }
      setBooking(data.booking);
    } catch (err) {
      setError('Could not update booking status. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const event = booking.event;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-xl2 border border-line bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">Booking reference</p>
              <h3 className="mt-1 font-display text-xl font-bold text-primary-dark">{booking.bookingReference}</h3>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                STATUS_STYLES[booking.bookingStatus]
              }`}
            >
              {booking.bookingStatus}
            </span>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <User size={16} className="mt-0.5 text-muted" />
              <div>
                <dt className="text-xs text-muted">Name</dt>
                <dd className="text-sm font-semibold text-ink">{booking.name}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Phone size={16} className="mt-0.5 text-muted" />
              <div>
                <dt className="text-xs text-muted">Mobile</dt>
                <dd className="text-sm font-semibold text-ink">{booking.mobile}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:col-span-2">
              <Mail size={16} className="mt-0.5 text-muted" />
              <div>
                <dt className="text-xs text-muted">Email</dt>
                <dd className="text-sm font-semibold text-ink">{booking.email}</dd>
              </div>
            </div>
          </dl>
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">Event</p>
          {event ? (
            <>
              <h4 className="mt-1 font-display text-lg font-bold text-primary-dark">{event.title}</h4>
              <div className="mt-3 space-y-2 text-sm text-ink">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-muted" />
                  {formatDate(event.eventDate)} · {formatTimeRange(event.startTime, event.endTime)}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-muted" />
                  {event.location}
                </div>
                <div className="text-muted">
                  Seats available:{' '}
                  <span className="font-semibold text-ink">
                    {event.availableSeats}/{event.maxSeats}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm italic text-muted">This event no longer exists.</p>
          )}
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">Payment snapshot</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Price</dt>
              <dd className="font-semibold text-ink">{formatAmount(booking.price)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Member discount</dt>
              <dd className="font-semibold text-ink">{booking.memberDiscount}%</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2">
              <dt className="text-muted">Final amount</dt>
              <dd className="font-display font-bold text-primary-dark">{formatAmount(booking.finalAmount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Booked on</dt>
              <dd className="text-ink">{formatDate(booking.bookingDate || booking.createdAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl2 border border-line bg-surface p-6">
          <p className="font-display text-sm font-bold text-primary-dark">Update status</p>
          {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
          <div className="mt-3 flex flex-col gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => changeStatus(option)}
                disabled={busy || booking.bookingStatus === option}
                className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm font-semibold capitalize transition-colors disabled:cursor-default ${
                  booking.bookingStatus === option
                    ? 'border-primary bg-primary/10 text-primary-dark'
                    : 'border-line text-ink hover:bg-sage'
                }`}
              >
                {option}
                {busy && booking.bookingStatus !== option && <Loader2 size={14} className="animate-spin" />}
              </button>
            ))}
          </div>
          {booking.bookingStatus !== 'cancelled' && (
            <button
              type="button"
              onClick={() => changeStatus('cancelled')}
              disabled={busy}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
              Cancel booking
            </button>
          )}
          <p className="mt-3 text-xs text-muted">
            Cancelling restores 1 seat to the event automatically. Reactivating a cancelled booking re-reserves a
            seat if one is still available.
          </p>
        </div>
      </div>
    </div>
  );
}
