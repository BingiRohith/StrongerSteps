import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Recipe from '@/models/Recipe';
import RecipeCategory from '@/models/RecipeCategory'; // eslint-disable-line no-unused-vars -- registers the ref before populate
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { DIFFICULTY_VALUES } from '@/lib/recipeOptions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/recipes
 * Query params: status ('draft'|'published'), category (id), tag,
 * difficulty, search (text). No pagination — mirrors
 * app/api/admin/products/route.js.
 */
export const GET = withErrorHandling(async (request) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const tag = searchParams.get('tag')?.trim().toLowerCase();
  const difficulty = searchParams.get('difficulty');
  const search = searchParams.get('search')?.trim();

  const query = {};
  if (status && ['draft', 'published'].includes(status)) query.status = status;
  if (category && mongoose.Types.ObjectId.isValid(category)) query.category = category;
  if (tag) query.tags = tag;
  if (difficulty && DIFFICULTY_VALUES.includes(difficulty)) query.difficulty = difficulty;
  if (search) query.$text = { $search: search };

  const recipes = await Recipe.find(query)
    .populate('author', 'name')
    .populate('category', 'name slug')
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  return ok({ recipes });
});

/**
 * POST /api/admin/recipes
 * Body: name, category (valid RecipeCategory id) required. `status` may be
 * 'draft' (default) or 'published'.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  await connectDB();

  const body = await request.json();

  if (!body?.name?.trim()) return fail('Recipe name is required', 400);
  if (!body?.category || !mongoose.Types.ObjectId.isValid(body.category)) {
    return fail('A valid category is required', 400);
  }
  const categoryExists = await RecipeCategory.exists({ _id: body.category });
  if (!categoryExists) return fail('Category not found', 400);

  const prepTime = Math.max(0, Number(body.prepTime) || 0);
  const cookTime = Math.max(0, Number(body.cookTime) || 0);
  const servings = Math.max(1, Number(body.servings) || 1);

  const recipe = await Recipe.create({
    name: body.name,
    slug: body.slug || undefined,
    shortDescription: body.shortDescription || '',
    fullDescription: body.fullDescription || '',
    category: body.category,
    tags: Array.isArray(body.tags) ? body.tags : [],
    difficulty: DIFFICULTY_VALUES.includes(body.difficulty) ? body.difficulty : 'Easy',
    prepTime,
    cookTime,
    servings,
    ingredients: Array.isArray(body.ingredients) ? body.ingredients : [],
    instructions: Array.isArray(body.instructions) ? body.instructions : [],
    nutrition: Array.isArray(body.nutrition) ? body.nutrition : [],
    featuredImage: {
      url: body.featuredImage?.url || '',
      alt: body.featuredImage?.alt || '',
    },
    gallery: Array.isArray(body.gallery) ? body.gallery : [],
    featured: Boolean(body.featured),
    displayOrder: Number.isFinite(body.displayOrder) ? body.displayOrder : 0,
    status: body.status === 'published' ? 'published' : 'draft',
    seo: {
      title: body.seo?.title || '',
      metaDescription: body.seo?.metaDescription || '',
    },
    author: user._id,
  });

  return ok({ recipe }, 201);
});
