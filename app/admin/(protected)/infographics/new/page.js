import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import InfographicForm from '@/components/admin/infographics/InfographicForm';

export default function NewInfographicPage() {
  return (
    <div>
      <Link
        href="/admin/infographics"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to infographics
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">New infographic</h2>
      <InfographicForm />
    </div>
  );
}
