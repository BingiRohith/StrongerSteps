import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import RecipeCategoryForm from '@/components/admin/recipe-categories/RecipeCategoryForm';

export default function NewRecipeCategoryPage() {
  return (
    <div>
      <Link
        href="/admin/recipe-categories"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to recipe categories
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">New recipe category</h2>
      <RecipeCategoryForm />
    </div>
  );
}
