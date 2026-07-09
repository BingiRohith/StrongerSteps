import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft } from 'lucide-react';
import connectDB from '@/lib/db';
import RecipeCategory from '@/models/RecipeCategory';
import RecipeCategoryForm from '@/components/admin/recipe-categories/RecipeCategoryForm';

export const dynamic = 'force-dynamic';

export default async function EditRecipeCategoryPage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const category = await RecipeCategory.findById(params.id).lean();
  if (!category) notFound();

  const initialData = JSON.parse(JSON.stringify(category));

  return (
    <div>
      <Link
        href="/admin/recipe-categories"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to recipe categories
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">Edit recipe category</h2>
      <RecipeCategoryForm categoryId={params.id} initialData={initialData} />
    </div>
  );
}
