import { Eyebrow } from '@/components/ui';
import BookingHistoryClient from '@/components/bookings/BookingHistoryClient';

export const metadata = {
  title: 'Booking History | Stronger Steps',
  description: 'Look up your Stronger Steps event bookings by mobile number.',
};

export default function BookingHistoryPage() {
  return (
    <section className="bg-bg">
      <div className="mx-auto max-w-content px-6 py-16 md:py-20">
        <Eyebrow>Booking History</Eyebrow>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold text-primary-dark md:text-4xl">
          Find your bookings
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Enter the mobile number you booked with to see your booking reference, event details, and status. Add a
          specific reference to look up a single booking.
        </p>

        <div className="mt-12">
          <BookingHistoryClient />
        </div>
      </div>
    </section>
  );
}
