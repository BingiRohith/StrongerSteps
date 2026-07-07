import { Soup, Salad, Wheat, Search, Filter, Tags } from 'lucide-react';
import { Eyebrow, SectionHeading } from '@/components/ui';
import StepDivider from '@/components/StepDivider';
import ComingSoonCard from '@/components/ComingSoonCard';

// Temporary placeholder page. Recipes is a full future CMS (CRS §14 —
// name, description, category, ingredients, instructions, images, prep/cook
// time, tags, featured, status, plus public search/filter) that hasn't been
// built yet; this route exists so the nav entry and homepage link resolve
// to something real in the meantime.
const RECIPE_CATEGORIES = [
  {
    icon: Salad,
    title: 'Everyday Meals',
    description: 'Simple, nourishing recipes for daily strength and energy — built for the Indian kitchen.',
  },
  {
    icon: Wheat,
    title: 'Bone & Joint Health',
    description: 'Recipes designed around calcium, protein, and anti-inflammatory ingredients.',
  },
  {
    icon: Soup,
    title: 'Easy to Digest',
    description: 'Gentle, easy-to-prepare recipes for sensitive digestion and lower energy days.',
  },
];

export default function RecipesPage() {
  return (
    <>
      <section className="bg-bg">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <Eyebrow>Recipes</Eyebrow>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold text-primary-dark md:text-4xl">
            Eating for strength, the Indian way
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Doctor-reviewed recipes built around the nutrition adults 50+ need most — coming soon,
            with search, filters, and categories to help you find exactly what you&apos;re looking for.
          </p>
        </div>
      </section>

      <StepDivider from="#FBF7EF" to="#E6EEE4" />

      <section className="bg-sage">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <SectionHeading
            eyebrow="What's coming"
            title="Recipe categories"
            description="A preview of how recipes will be organised once this module launches."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {RECIPE_CATEGORIES.map(({ icon, title, description }) => (
              <ComingSoonCard key={title} icon={icon} title={title} description={description} />
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted">
            <span className="flex items-center gap-2">
              <Search size={16} className="text-primary" aria-hidden="true" /> Search
            </span>
            <span className="flex items-center gap-2">
              <Filter size={16} className="text-primary" aria-hidden="true" /> Filter by category
            </span>
            <span className="flex items-center gap-2">
              <Tags size={16} className="text-primary" aria-hidden="true" /> Tags & prep time
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
