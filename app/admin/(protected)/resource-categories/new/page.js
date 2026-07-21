import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ResourceCategoryForm from '@/components/admin/resource-categories/ResourceCategoryForm';

export default function NewResourceCategoryPage() {
  return (
    <div>
      <Link
        href="/admin/resource-categories"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to resource categories
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">New resource category</h2>
      <ResourceCategoryForm />
    </div>
  );
}
