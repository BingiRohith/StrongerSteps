import { Eyebrow } from '@/components/ui';
import BookingHistoryClient from '@/components/bookings/BookingHistoryClient';

export const metadata = {
  title: 'Booking History',
  description: 'Look up a Stronger Steps event booking with its reference and mobile number.',
  alternates: { canonical: '/booking-history' },
  openGraph: { title: 'Booking History | Stronger Steps', url: '/booking-history' },
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
          Enter the booking reference from your confirmation and the mobile number you booked with to see its event
          details and current status.
        </p>

        <div className="mt-12">
          <BookingHistoryClient />
        </div>
      </div>
    </section>
  );
}
