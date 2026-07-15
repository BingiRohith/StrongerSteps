import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Users as UsersIcon, Flame, ChefHat, Soup } from 'lucide-react';
import { Badge, SectionHeading } from '@/components/ui';
import StepDivider from '@/components/StepDivider';
import RecipeCard from '@/components/recipes/RecipeCard';
import { getRecipeBySlug, getRelatedRecipes } from '@/lib/publicRecipes';

// Reads live from MongoDB on every request — recipes are published/edited
// from the admin panel at any time, so this page can't be statically
// cached at build time (same reasoning as app/knowledge-center/blogs/[slug]/page.js).
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const recipe = await getRecipeBySlug(params.slug);

  if (!recipe) {
    return { title: 'Recipe not found' };
  }

  const title = recipe.seo?.title || recipe.name;
  const description = recipe.seo?.metaDescription || recipe.shortDescription || undefined;
  const ogImages = recipe.featuredImage?.url
    ? [{ url: recipe.featuredImage.url, alt: recipe.featuredImage.alt || recipe.name }]
    : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `/recipes/${recipe.slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      images: ogImages,
    },
    twitter: {
      card: ogImages ? 'summary_large_image' : 'summary',
      title,
      description,
      images: ogImages,
    },
  };
}

export default async function RecipeDetailPage({ params }) {
  const recipe = await getRecipeBySlug(params.slug);

  if (!recipe) {
    notFound();
  }

  const related = await getRelatedRecipes(recipe, 3);
  const totalTime = (Number(recipe.prepTime) || 0) + (Number(recipe.cookTime) || 0);

  return (
    <>
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <Link
            href="/recipes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Recipes
          </Link>

          <div className="mt-6 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {recipe.category?.name && <Badge tone="accent">{recipe.category.name}</Badge>}
              {recipe.tags?.map((tag) => (
                <Badge key={tag} tone="sage">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-primary-dark md:text-4xl">
              {recipe.name}
            </h1>
            {recipe.shortDescription && <p className="mt-4 text-lg text-muted">{recipe.shortDescription}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-muted">
              {totalTime > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={15} aria-hidden="true" />
                  {totalTime} min total
                  {(recipe.prepTime > 0 || recipe.cookTime > 0) && (
                    <span className="text-xs">
                      ({recipe.prepTime || 0} prep + {recipe.cookTime || 0} cook)
                    </span>
                  )}
                </span>
              )}
              {recipe.servings > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <UsersIcon size={15} aria-hidden="true" />
                  {recipe.servings} serving{recipe.servings === 1 ? '' : 's'}
                </span>
              )}
              {recipe.difficulty && (
                <span className="inline-flex items-center gap-1.5">
                  <Flame size={15} aria-hidden="true" />
                  {recipe.difficulty}
                </span>
              )}
            </div>
          </div>

          {recipe.featuredImage?.url && (
            <div className="mt-10 aspect-[16/8] w-full overflow-hidden rounded-xl2 bg-sage">
              {/* eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file, not an optimizable remote image */}
              <img
                src={recipe.featuredImage.url}
                alt={recipe.featuredImage.alt || recipe.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </section>

      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 pb-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
            <div>
              {recipe.fullDescription && (
                <p className="mb-8 whitespace-pre-line text-base leading-relaxed text-ink">
                  {recipe.fullDescription}
                </p>
              )}

              {recipe.instructions?.length > 0 && (
                <div>
                  <h2 className="mb-4 font-display text-2xl font-bold text-primary-dark">Instructions</h2>
                  <ol className="space-y-4">
                    {recipe.instructions.map((step, index) => (
                      // eslint-disable-next-line react/no-array-index-key -- steps are plain strings with no stable id
                      <li key={index} className="flex gap-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-white">
                          {index + 1}
                        </span>
                        <p className="pt-1 text-base leading-relaxed text-ink">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {recipe.gallery?.length > 0 && (
                <div className="mt-10">
                  <h2 className="mb-4 font-display text-2xl font-bold text-primary-dark">Gallery</h2>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {recipe.gallery.map((img, index) => (
                      <div key={img.url || index} className="aspect-square overflow-hidden rounded-xl2 bg-sage">
                        {/* eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file */}
                        <img src={img.url} alt={img.alt || recipe.name} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-6 lg:sticky lg:top-8 lg:h-fit">
              {recipe.ingredients?.length > 0 && (
                <div className="rounded-xl2 border border-line bg-white p-6">
                  <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-primary-dark">
                    <ChefHat size={18} aria-hidden="true" />
                    Ingredients
                  </h2>
                  <ul className="space-y-2.5">
                    {recipe.ingredients.map((ingredient, index) => (
                      // eslint-disable-next-line react/no-array-index-key -- ingredients are plain strings with no stable id
                      <li key={index} className="flex items-start gap-2.5 text-sm text-ink">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {recipe.nutrition?.length > 0 && (
                <div className="rounded-xl2 border border-line bg-white p-6">
                  <h2 className="mb-4 font-display text-lg font-bold text-primary-dark">Nutrition</h2>
                  <dl className="divide-y divide-line">
                    {recipe.nutrition.map((row, index) => (
                      // eslint-disable-next-line react/no-array-index-key -- rows have no stable id
                      <div key={index} className="flex items-center justify-between py-2 text-sm">
                        <dt className="text-muted">{row.label}</dt>
                        <dd className="font-semibold text-ink">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <>
          <StepDivider from="#FBF7EF" to="#E6EEE4" />
          <section className="bg-sage">
            <div className="mx-auto max-w-content px-6 py-16 md:py-20">
              <SectionHeading
                eyebrow="Keep cooking"
                title="More recipes like this"
                description="Other recipes from the same category."
              />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <RecipeCard key={item._id} recipe={item} />
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {related.length === 0 && (
        <div className="mx-auto max-w-content px-6 pb-12">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Soup size={14} aria-hidden="true" />
            More recipes coming soon.
          </div>
        </div>
      )}
    </>
  );
}
