import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ResourceForm from '@/components/admin/resources/ResourceForm';

export default function NewResourcePage() {
  return (
    <div>
      <Link
        href="/admin/resources"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to resources
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">New resource</h2>
      <ResourceForm />
    </div>
  );
}
