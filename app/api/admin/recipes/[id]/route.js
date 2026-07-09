import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Recipe from '@/models/Recipe';
import RecipeCategory from '@/models/RecipeCategory';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { DIFFICULTY_VALUES } from '@/lib/recipeOptions';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid recipe id', 400);

  await connectDB();
  const recipe = await Recipe.findById(params.id)
    .populate('author', 'name')
    .populate('category', 'name slug');
  if (!recipe) return fail('Recipe not found', 404);

  return ok({ recipe });
});

/**
 * PUT /api/admin/recipes/:id — partial update. Any subset of recipe fields
 * may be sent; only the fields present in the body are applied. Also used
 * by the admin list's reorder controls to swap `displayOrder` between two
 * adjacent recipes.
 */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid recipe id', 400);

  await connectDB();
  const recipe = await Recipe.findById(params.id);
  if (!recipe) return fail('Recipe not found', 404);

  const body = await request.json();

  if (body.name !== undefined) {
    if (!body.name.trim()) return fail('Recipe name is required', 400);
    recipe.name = body.name;
  }
  if (body.slug !== undefined) recipe.slug = body.slug;
  if (body.shortDescription !== undefined) recipe.shortDescription = body.shortDescription;
  if (body.fullDescription !== undefined) recipe.fullDescription = body.fullDescription;
  if (body.category !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(body.category)) return fail('A valid category is required', 400);
    const categoryExists = await RecipeCategory.exists({ _id: body.category });
    if (!categoryExists) return fail('Category not found', 400);
    recipe.category = body.category;
  }
  if (body.tags !== undefined) recipe.tags = Array.isArray(body.tags) ? body.tags : [];
  if (body.difficulty !== undefined) {
    if (!DIFFICULTY_VALUES.includes(body.difficulty)) return fail('Invalid difficulty', 400);
    recipe.difficulty = body.difficulty;
  }
  if (body.prepTime !== undefined) recipe.prepTime = Math.max(0, Number(body.prepTime) || 0);
  if (body.cookTime !== undefined) recipe.cookTime = Math.max(0, Number(body.cookTime) || 0);
  if (body.servings !== undefined) recipe.servings = Math.max(1, Number(body.servings) || 1);
  if (body.ingredients !== undefined) {
    recipe.ingredients = Array.isArray(body.ingredients) ? body.ingredients : [];
  }
  if (body.instructions !== undefined) {
    recipe.instructions = Array.isArray(body.instructions) ? body.instructions : [];
  }
  if (body.nutrition !== undefined) {
    recipe.nutrition = Array.isArray(body.nutrition) ? body.nutrition : [];
  }
  if (body.featuredImage !== undefined) {
    recipe.featuredImage = {
      url: body.featuredImage?.url || '',
      alt: body.featuredImage?.alt || '',
    };
  }
  if (body.gallery !== undefined) recipe.gallery = Array.isArray(body.gallery) ? body.gallery : [];
  if (body.featured !== undefined) recipe.featured = Boolean(body.featured);
  if (body.displayOrder !== undefined) {
    recipe.displayOrder = Number.isFinite(body.displayOrder) ? body.displayOrder : 0;
  }
  if (body.status !== undefined) {
    if (!['draft', 'published'].includes(body.status)) return fail('Invalid status', 400);
    recipe.status = body.status;
  }
  if (body.seo !== undefined) {
    recipe.seo = {
      title: body.seo?.title || '',
      metaDescription: body.seo?.metaDescription || '',
    };
  }

  await recipe.save();

  return ok({ recipe });
});

export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid recipe id', 400);

  await connectDB();
  const recipe = await Recipe.findByIdAndDelete(params.id);
  if (!recipe) return fail('Recipe not found', 404);

  return ok({ deleted: true });
});
