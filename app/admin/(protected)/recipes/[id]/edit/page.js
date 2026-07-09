import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft } from 'lucide-react';
import connectDB from '@/lib/db';
import Recipe from '@/models/Recipe';
import RecipeCategory from '@/models/RecipeCategory'; // eslint-disable-line no-unused-vars -- registers the ref before populate
import RecipeForm from '@/components/admin/recipes/RecipeForm';

export const dynamic = 'force-dynamic';

export default async function EditRecipePage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const recipe = await Recipe.findById(params.id).populate('category', 'name slug isActive').lean();
  if (!recipe) notFound();

  const initialData = JSON.parse(JSON.stringify(recipe));

  return (
    <div>
      <Link
        href="/admin/recipes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to recipes
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">Edit recipe</h2>
      <RecipeForm recipeId={params.id} initialData={initialData} />
    </div>
  );
}
