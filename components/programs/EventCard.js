'use client';

import { Calendar, Clock, MapPin, User, Crown, Users } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { formatTimeRange } from '@/lib/eventFormat';

function formatPrice(price) {
  if (!price) return 'Free';
  return `₹${price.toLocaleString('en-IN')}`;
}

function bookingState(event) {
  const now = new Date();
  if (event.availableSeats <= 0) return { disabled: true, label: 'Fully Booked' };
  if (event.registrationOpens && now < new Date(event.registrationOpens)) {
    return {
      disabled: true,
      label: `Registration opens ${new Date(event.registrationOpens).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      })}`,
    };
  }
  if (event.registrationCloses && now > new Date(event.registrationCloses)) {
    return { disabled: true, label: 'Registration Closed' };
  }
  return { disabled: false, label: 'Book Your Seat' };
}

export default function EventCard({ event, onBook }) {
  const { disabled, label } = bookingState(event);

  return (
    <div className="flex flex-col gap-4 rounded-xl2 border border-line bg-white p-5 sm:flex-row sm:p-6">
      {event.image?.url ? (
        // eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file, not an optimizable remote image
        <img
          src={event.image.url}
          alt={event.image.alt || ''}
          className="h-40 w-full shrink-0 rounded-lg object-cover sm:h-auto sm:w-36"
        />
      ) : (
        <span className="flex h-40 w-full shrink-0 items-center justify-center rounded-lg bg-sage text-primary-dark sm:h-auto sm:w-36">
          <Calendar size={28} aria-hidden="true" />
        </span>
      )}

      <div className="flex flex-1 flex-col">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h4 className="font-display text-base font-bold text-primary-dark">{event.title}</h4>
          {event.featured && <Badge tone="accent">Featured</Badge>}
        </div>

        {event.shortDescription && <p className="mt-1 text-sm text-muted">{event.shortDescription}</p>}

        <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm text-ink sm:grid-cols-2">
          <span className="inline-flex items-center gap-2">
            <Clock size={14} className="text-primary" aria-hidden="true" />
            {formatTimeRange(event.startTime, event.endTime)}
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin size={14} className="text-primary" aria-hidden="true" />
            {event.location}
          </span>
          <span className="inline-flex items-center gap-2">
            <User size={14} className="text-primary" aria-hidden="true" />
            {event.hostName}
          </span>
          <span className="inline-flex items-center gap-2">
            <Users size={14} className="text-primary" aria-hidden="true" />
            {event.availableSeats} of {event.maxSeats} seats available
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold text-primary-dark">{formatPrice(event.price)}</span>
            {event.memberDiscountPercentage > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-dark">
                <Crown size={12} aria-hidden="true" />
                {event.memberDiscountPercentage}% member discount
              </span>
            )}
          </div>

          {disabled ? (
            <Badge tone="outline">{label}</Badge>
          ) : (
            <Button type="button" onClick={onBook} variant="primary">
              {label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
