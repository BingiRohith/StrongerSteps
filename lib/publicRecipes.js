import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Recipe from '@/models/Recipe';
import RecipeCategory from '@/models/RecipeCategory'; // eslint-disable-line no-unused-vars -- registers the ref before populate

/**
 * Read-only query helpers for the *public* Recipes pages (`/recipes`,
 * `/recipes/[slug]`) and the public `/api/recipes` route. Every query here
 * is hard-scoped to `status: 'published'` — drafts are never reachable from
 * the public site, only from the existing admin routes in
 * `app/api/admin/recipes/*`. Filtering/sorting/pagination are all
 * server-side (per the CRS — "do NOT fetch the entire recipe collection
 * into the browser"), mirroring the Sprint 12.5 `lib/publicProducts.js`
 * pattern.
 */

function serialize(doc) {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

const SORT_OPTIONS = {
  'name-asc': { name: 1 },
  newest: { publishedAt: -1 },
  featured: { featured: -1, displayOrder: 1 },
};
const DEFAULT_SORT = { displayOrder: 1, name: 1 };

/**
 * Published recipes with optional category (slug)/tag/difficulty/text-search
 * filters, a sort option, and page-based pagination.
 */
export async function getPublishedRecipes({
  category = '',
  tag = '',
  difficulty = '',
  search = '',
  sort = '',
  page = 1,
  limit = 12,
} = {}) {
  await connectDB();

  const query = { status: 'published' };

  if (category) {
    const categoryDoc = await RecipeCategory.findOne({ slug: category }).select('_id').lean();
    query.category = categoryDoc ? categoryDoc._id : null; // no match -> empty results, not "ignore filter"
  }
  if (tag) query.tags = tag.trim().toLowerCase();
  if (difficulty) query.difficulty = difficulty;
  if (search?.trim()) query.$text = { $search: search.trim() };

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(48, Math.max(1, Number(limit) || 12));
  const sortSpec = SORT_OPTIONS[sort] || DEFAULT_SORT;

  const [recipes, total] = await Promise.all([
    Recipe.find(query)
      .populate('category', 'name slug')
      .sort(sortSpec)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Recipe.countDocuments(query),
  ]);

  return {
    recipes: serialize(recipes),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

/** Up to `limit` featured, published recipes — powers the Recipes page's "Featured Recipes" section. */
export async function getFeaturedRecipes(limit = 3) {
  await connectDB();

  const recipes = await Recipe.find({ status: 'published', featured: true })
    .populate('category', 'name slug')
    .sort({ displayOrder: 1, publishedAt: -1 })
    .limit(limit)
    .lean();

  return serialize(recipes);
}

/**
 * Active recipe categories, admin-ordered — powers the public Category
 * Navigation. Unlike Products' derived facets (only categories with a
 * published item), this reflects the admin-curated set directly, since the
 * CRS frames Recipe Categories as an independently managed navigation
 * structure (Create/Edit/Delete/Activate/Reorder), not just a filter facet.
 */
export async function getActiveRecipeCategories() {
  await connectDB();

  const categories = await RecipeCategory.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  return serialize(categories);
}

/** Distinct tags among published recipes — powers the dynamic tag filter chips. */
export async function getRecipeTagsFacet() {
  await connectDB();

  const tags = await Recipe.distinct('tags', { status: 'published' });

  return tags.filter(Boolean).sort((a, b) => a.localeCompare(b));
}

/** A single published recipe by slug, with full detail for the detail page. */
export async function getRecipeBySlug(slug) {
  await connectDB();

  const recipe = await Recipe.findOne({ slug, status: 'published' })
    .populate('category', 'name slug')
    .populate('author', 'name')
    .lean();

  return serialize(recipe);
}

/** Up to `limit` other published recipes in the same category. */
export async function getRelatedRecipes(recipe, limit = 3) {
  await connectDB();

  const categoryId = recipe?.category?._id || recipe?.category;
  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) return [];

  const related = await Recipe.find({
    status: 'published',
    category: categoryId,
    slug: { $ne: recipe.slug },
  })
    .populate('category', 'name slug')
    .sort({ displayOrder: 1, publishedAt: -1 })
    .limit(limit)
    .lean();

  return serialize(related);
}
