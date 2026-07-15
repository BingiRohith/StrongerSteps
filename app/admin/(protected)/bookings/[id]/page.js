import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft } from 'lucide-react';
import connectDB from '@/lib/db';
import Booking from '@/models/Booking';
import '@/models/Event';
import BookingDetailClient from '@/components/admin/bookings/BookingDetailClient';

export const dynamic = 'force-dynamic';

export default async function BookingDetailPage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const booking = await Booking.findById(params.id).populate('event').lean();
  if (!booking) notFound();

  const initialBooking = JSON.parse(JSON.stringify(booking));

  return (
    <div>
      <Link
        href="/admin/bookings"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to bookings
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">Booking detail</h2>
      <BookingDetailClient initialBooking={initialBooking} />
    </div>
  );
}
