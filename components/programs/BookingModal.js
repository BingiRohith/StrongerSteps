'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { isValidEmail, isValidMobile } from '@/lib/eventValidation';
import { formatTimeRange } from '@/lib/eventFormat';

function formatPrice(amount) {
  if (!amount) return 'Free';
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function BookingModal({ event, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', mobile: '', email: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [booking, setBooking] = useState(null);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Full name is required';
    if (!isValidMobile(form.mobile)) next.mobile = 'Enter a valid 10-digit mobile number';
    if (!isValidEmail(form.email)) next.email = 'Enter a valid email address';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event._id, ...form }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      setBooking(data.booking);
      onSuccess(data.event);
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={booking ? 'Booking confirmed' : 'Book your seat'}
    >
      <div className="w-full max-w-md overflow-y-auto rounded-xl2 bg-white p-6 shadow-xl max-h-[90vh]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
              {booking ? 'Booking confirmed' : 'Book your seat'}
            </p>
            <h3 className="mt-1 font-display text-lg font-bold text-primary-dark">{event.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-sage"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {booking ? (
          <div className="mt-5">
            <div className="flex items-center gap-2 rounded-lg bg-primary-light/10 px-3.5 py-3 text-sm text-primary-dark">
              <CheckCircle2 size={18} className="shrink-0" aria-hidden="true" />
              <span>Your seat is reserved. See you there!</span>
            </div>

            <dl className="mt-5 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Booking reference</dt>
                <dd className="font-semibold text-ink">{booking.bookingReference}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Date & time</dt>
                <dd className="text-right font-semibold text-ink">
                  {new Date(event.eventDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'UTC',
                  })}
                  {', '}
                  {formatTimeRange(event.startTime, event.endTime)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Location</dt>
                <dd className="text-right font-semibold text-ink">{event.location}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Booked for</dt>
                <dd className="text-right font-semibold text-ink">{booking.name}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-line pt-2.5">
                <dt className="text-muted">Amount</dt>
                <dd className="font-display font-bold text-primary-dark">{formatPrice(booking.finalAmount)}</dd>
              </div>
            </dl>

            <Button type="button" onClick={onClose} variant="primary" className="mt-6 w-full">
              Done
            </Button>
            <Link
              href="/booking-history"
              className="mt-3 block text-center text-sm font-semibold text-primary hover:underline"
            >
              View my bookings
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {submitError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="booking-name">
                Full name
              </label>
              <input
                id="booking-name"
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.name && <p className="mt-1 text-xs font-semibold text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="booking-mobile">
                Mobile number
              </label>
              <input
                id="booking-mobile"
                type="tel"
                value={form.mobile}
                onChange={(e) => update('mobile', e.target.value)}
                placeholder="9876543210"
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.mobile && <p className="mt-1 text-xs font-semibold text-red-600">{errors.mobile}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="booking-email">
                Email address
              </label>
              <input
                id="booking-email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.email && <p className="mt-1 text-xs font-semibold text-red-600">{errors.email}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Confirm Booking
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
