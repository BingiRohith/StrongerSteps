import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import EventForm from '@/components/admin/events/EventForm';

export default function NewEventPage() {
  return (
    <div>
      <Link
        href="/admin/events"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to programs
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">New event</h2>
      <EventForm />
    </div>
  );
}
