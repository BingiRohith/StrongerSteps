import { Star } from 'lucide-react';
import { SectionHeading } from '@/components/ui';
import RecipeCard from './RecipeCard';

export default function FeaturedRecipes({ recipes }) {
  if (!recipes || recipes.length === 0) return null;

  return (
    <section className="bg-sage">
      <div className="mx-auto max-w-content px-6 py-16 md:py-20">
        <SectionHeading
          eyebrow="Featured"
          title={
            <span className="inline-flex items-center gap-2">
              <Star size={24} className="fill-current text-accent-dark" aria-hidden="true" />
              Featured Recipes
            </span>
          }
          description="Hand-picked by our team — a great place to start."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe._id} recipe={recipe} />
          ))}
        </div>
      </div>
    </section>
  );
}
