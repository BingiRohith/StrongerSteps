import { Eyebrow } from '@/components/ui';
import ProgramsCalendar from '@/components/programs/ProgramsCalendar';
import { getPublishedEventsForMonth } from '@/lib/publicEvents';

export const dynamic = 'force-dynamic';

export default async function ProgramsPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const events = await getPublishedEventsForMonth(year, month);

  return (
    <section className="bg-bg">
      <div className="mx-auto max-w-content px-6 py-16 md:py-20">
        <Eyebrow>Programs</Eyebrow>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold text-primary-dark md:text-4xl">
          Find and book your next session
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Browse workshops, webinars, and community sessions on the calendar below. Pick a date to see
          what&apos;s on, then reserve your seat in a few taps.
        </p>

        <div className="mt-12">
          <ProgramsCalendar initialYear={year} initialMonth={month} initialEvents={events} />
        </div>
      </div>
    </section>
  );
}
