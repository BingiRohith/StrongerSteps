import Link from 'next/link';
import { Clock, Flame, Soup, Star } from 'lucide-react';
import { Badge } from '@/components/ui';

/**
 * Recipe card for the public /recipes grid — mirrors
 * components/products/ProductCard.js's shape (image, badges, meta row) but
 * with recipe-specific fields (category, tags, difficulty, prep/cook time)
 * per the CRS's Recipe Cards spec.
 */
export default function RecipeCard({ recipe }) {
  if (!recipe) return null;

  const totalTime = (Number(recipe.prepTime) || 0) + (Number(recipe.cookTime) || 0);

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl2 border border-line bg-white transition-colors hover:border-primary"
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-sage">
        {recipe.featuredImage?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file, not an optimizable remote image
          <img
            src={recipe.featuredImage.url}
            alt={recipe.featuredImage.alt || recipe.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary/25">
            <Soup size={36} aria-hidden="true" />
          </div>
        )}
        {recipe.category?.name && (
          <span className="absolute left-3 top-3">
            <Badge tone="accent">{recipe.category.name}</Badge>
          </span>
        )}
        {recipe.featured && (
          <span className="absolute right-3 top-3">
            <Badge tone="primary">
              <Star size={11} className="mr-1 -ml-0.5 fill-current" aria-hidden="true" />
              Featured
            </Badge>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-semibold leading-snug text-primary-dark line-clamp-2 group-hover:text-primary">
          {recipe.name}
        </h3>
        {recipe.shortDescription && (
          <p className="mt-2 flex-1 text-sm text-muted line-clamp-2">{recipe.shortDescription}</p>
        )}

        {recipe.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-sage px-2.5 py-1 text-xs font-semibold capitalize text-primary-dark"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
          {totalTime > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock size={13} aria-hidden="true" />
              {totalTime} min
            </span>
          )}
          {recipe.difficulty && (
            <span className="inline-flex items-center gap-1">
              <Flame size={13} aria-hidden="true" />
              {recipe.difficulty}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
