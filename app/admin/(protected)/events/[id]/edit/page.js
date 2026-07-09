import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft } from 'lucide-react';
import connectDB from '@/lib/db';
import Event from '@/models/Event';
import EventForm from '@/components/admin/events/EventForm';

export const dynamic = 'force-dynamic';

export default async function EditEventPage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const event = await Event.findById(params.id).lean();
  if (!event) notFound();

  const initialData = JSON.parse(JSON.stringify(event));

  return (
    <div>
      <Link
        href="/admin/events"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to programs
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">Edit event</h2>
      <EventForm eventId={params.id} initialData={initialData} />
    </div>
  );
}
