'use client';

import { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import { CalendarX, Loader2 } from 'lucide-react';
import EventCard from '@/components/programs/EventCard';
import BookingModal from '@/components/programs/BookingModal';
import { toDateKey, eventDateKey } from '@/lib/eventFormat';
import 'react-calendar/dist/Calendar.css';
import '@/components/programs/calendar-theme.css';

export default function ProgramsCalendar({ initialYear, initialMonth, initialEvents }) {
  const [activeStartDate, setActiveStartDate] = useState(new Date(initialYear, initialMonth - 1, 1));
  const [events, setEvents] = useState(initialEvents || []);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(
    today.getFullYear() === initialYear && today.getMonth() + 1 === initialMonth ? today : null
  );
  const [bookingEvent, setBookingEvent] = useState(null);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const event of events) {
      const key = eventDateKey(event.eventDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    }
    return map;
  }, [events]);

  const selectedDayEvents = selectedDate ? eventsByDay.get(toDateKey(selectedDate)) || [] : [];

  async function handleActiveStartDateChange({ activeStartDate: newActiveStartDate }) {
    setActiveStartDate(newActiveStartDate);
    setSelectedDate(null);
    setLoadingMonth(true);
    try {
      const year = newActiveStartDate.getFullYear();
      const month = newActiveStartDate.getMonth() + 1;
      const res = await fetch(`/api/events?year=${year}&month=${month}`);
      const data = await res.json();
      if (res.ok && data.success) setEvents(data.events);
    } finally {
      setLoadingMonth(false);
    }
  }

  function handleBookingSuccess(updatedEvent) {
    setEvents((prev) => prev.map((e) => (e._id === updatedEvent._id ? updatedEvent : e)));
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <div className="relative">
          {loadingMonth && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl2 bg-white/60">
              <Loader2 size={22} className="animate-spin text-primary" />
            </div>
          )}
          <Calendar
            className="ss-calendar"
            locale="en-IN"
            activeStartDate={activeStartDate}
            onActiveStartDateChange={handleActiveStartDateChange}
            value={selectedDate}
            onClickDay={(date) => setSelectedDate(date)}
            minDetail="month"
            maxDetail="month"
            showNeighboringMonth
            next2Label={null}
            prev2Label={null}
            prevAriaLabel="Previous month"
            nextAriaLabel="Next month"
            tileContent={({ date, view }) =>
              view === 'month' && eventsByDay.has(toDateKey(date)) ? (
                <span className="event-dot" aria-hidden="true" />
              ) : null
            }
          />
        </div>
      </div>

      <div className="lg:col-span-3">
        <h3 className="font-display text-lg font-bold text-primary-dark">
          {selectedDate
            ? selectedDate.toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : 'Select a date'}
        </h3>

        {!selectedDate ? (
          <p className="mt-3 text-sm text-muted">Click any date on the calendar to see events scheduled that day.</p>
        ) : selectedDayEvents.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-xl2 border border-line bg-white px-6 py-14 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
              <CalendarX size={20} aria-hidden="true" />
            </span>
            <p className="font-display text-sm font-semibold text-ink">No events scheduled for this day</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              Check another date on the calendar, or come back soon — new sessions are added regularly.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {selectedDayEvents.map((event) => (
              <EventCard key={event._id} event={event} onBook={() => setBookingEvent(event)} />
            ))}
          </div>
        )}
      </div>

      {bookingEvent && (
        <BookingModal
          event={bookingEvent}
          onClose={() => setBookingEvent(null)}
          onSuccess={(updatedEvent) => handleBookingSuccess(updatedEvent)}
        />
      )}
    </div>
  );
}
