import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import CategoryForm from '@/components/admin/categories/CategoryForm';

export default function NewCategoryPage() {
  return (
    <div>
      <Link href="/admin/categories" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
        <ChevronLeft size={16} />
        Back to blog categories
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">New blog category</h2>
      <CategoryForm />
    </div>
  );
}
