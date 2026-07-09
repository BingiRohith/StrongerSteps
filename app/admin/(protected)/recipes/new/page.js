import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import RecipeForm from '@/components/admin/recipes/RecipeForm';

export default function NewRecipePage() {
  return (
    <div>
      <Link
        href="/admin/recipes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to recipes
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">New recipe</h2>
      <RecipeForm />
    </div>
  );
}
