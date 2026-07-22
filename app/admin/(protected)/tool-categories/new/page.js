import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ToolCategoryForm from '@/components/admin/tool-categories/ToolCategoryForm';

export default function NewToolCategoryPage() {
  return (
    <div>
      <Link
        href="/admin/tool-categories"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to tool categories
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">New tool category</h2>
      <ToolCategoryForm />
    </div>
  );
}
