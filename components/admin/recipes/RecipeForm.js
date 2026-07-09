'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Save, Send, Star } from 'lucide-react';
import ImageUploadField from '@/components/admin/infographics/ImageUploadField';
import TagsInput from '@/components/admin/blogs/TagsInput';
import IngredientsEditor from './IngredientsEditor';
import InstructionsEditor from './InstructionsEditor';
import NutritionEditor from './NutritionEditor';
import GalleryUpload from './GalleryUpload';
import { slugify } from '@/lib/slugify';
import { DIFFICULTY_LEVELS } from '@/lib/recipeOptions';

const EMPTY_RECIPE = {
  name: '',
  slug: '',
  shortDescription: '',
  fullDescription: '',
  category: '',
  tags: [],
  difficulty: 'Easy',
  prepTime: 0,
  cookTime: 0,
  servings: 1,
  ingredients: [],
  instructions: [],
  nutrition: [],
  featuredImage: { url: '', alt: '' },
  gallery: [],
  featured: false,
  displayOrder: 0,
  status: 'draft',
  seo: { title: '', metaDescription: '' },
};

export default function RecipeForm({ recipeId, initialData }) {
  const router = useRouter();
  const isEdit = Boolean(recipeId);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [form, setForm] = useState(() => ({
    ...EMPTY_RECIPE,
    ...initialData,
    category: initialData?.category?._id || initialData?.category || '',
    featuredImage: { ...EMPTY_RECIPE.featuredImage, ...initialData?.featuredImage },
    seo: { ...EMPTY_RECIPE.seo, ...initialData?.seo },
  }));
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(null); // 'draft' | 'published' | null
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/recipe-categories');
        const data = await res.json();
        if (res.ok && data.success) setCategories(data.categories);
      } finally {
        setCategoriesLoading(false);
      }
    })();
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleNameChange(name) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: slugTouched ? prev.slug : slugify(name),
    }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Recipe name is required';
    if (!form.category) next.category = 'Category is required';
    if (form.shortDescription && form.shortDescription.length > 300) {
      next.shortDescription = 'Short description must be 300 characters or fewer';
    }
    if (Number(form.prepTime) < 0) next.prepTime = 'Cannot be negative';
    if (Number(form.cookTime) < 0) next.cookTime = 'Cannot be negative';
    if (Number(form.servings) < 1) next.servings = 'Must be at least 1';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(status) {
    setSubmitError('');
    if (!validate()) return;

    setSubmitting(status);
    try {
      const payload = {
        ...form,
        status,
        prepTime: Math.max(0, Number(form.prepTime) || 0),
        cookTime: Math.max(0, Number(form.cookTime) || 0),
        servings: Math.max(1, Number(form.servings) || 1),
        displayOrder: Number(form.displayOrder) || 0,
      };
      const res = await fetch(
        isEdit ? `/api/admin/recipes/${recipeId}` : '/api/admin/recipes',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Something went wrong. Please try again.');
        setSubmitting(null);
        return;
      }

      router.push('/admin/recipes');
      router.refresh();
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.');
      setSubmitting(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {submitError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <label className="block text-sm font-semibold text-ink" htmlFor="name">
            Recipe name
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="High Protein Paneer Salad"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.name && <p className="mt-1 text-xs font-semibold text-red-600">{errors.name}</p>}

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="slug">
            Slug
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-sm text-muted">/recipes/</span>
            <input
              id="slug"
              type="text"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update('slug', slugify(e.target.value));
              }}
              placeholder="auto-generated-from-name"
              className="flex-1 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {slugTouched && (
              <button
                type="button"
                onClick={() => {
                  setSlugTouched(false);
                  update('slug', slugify(form.name));
                }}
                className="shrink-0 text-xs font-semibold text-primary hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            disabled={categoriesLoading}
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">{categoriesLoading ? 'Loading categories…' : 'Select a category'}</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
                {!c.isActive ? ' (inactive)' : ''}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-xs font-semibold text-red-600">{errors.category}</p>
          )}
          {!categoriesLoading && categories.length === 0 && (
            <p className="mt-1 text-xs text-muted">
              No recipe categories yet — create one first from Recipe Categories.
            </p>
          )}

          <label className="mt-4 block text-sm font-semibold text-ink">Tags</label>
          <div className="mt-1.5">
            <TagsInput value={form.tags} onChange={(tags) => update('tags', tags)} />
          </div>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="shortDescription">
            Short description
          </label>
          <textarea
            id="shortDescription"
            rows={2}
            value={form.shortDescription}
            onChange={(e) => update('shortDescription', e.target.value)}
            placeholder="A short summary shown on recipe cards"
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.shortDescription ? (
              <p className="text-xs font-semibold text-red-600">{errors.shortDescription}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-muted">{form.shortDescription?.length || 0}/300</p>
          </div>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="fullDescription">
            Full description
          </label>
          <textarea
            id="fullDescription"
            rows={5}
            value={form.fullDescription}
            onChange={(e) => update('fullDescription', e.target.value)}
            placeholder="The full recipe intro shown on the detail page"
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Details</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="difficulty">
                Difficulty
              </label>
              <select
                id="difficulty"
                value={form.difficulty}
                onChange={(e) => update('difficulty', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {DIFFICULTY_LEVELS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="prepTime">
                Prep time (min)
              </label>
              <input
                id="prepTime"
                type="number"
                min="0"
                value={form.prepTime}
                onChange={(e) => update('prepTime', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.prepTime && <p className="mt-1 text-xs font-semibold text-red-600">{errors.prepTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="cookTime">
                Cook time (min)
              </label>
              <input
                id="cookTime"
                type="number"
                min="0"
                value={form.cookTime}
                onChange={(e) => update('cookTime', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.cookTime && <p className="mt-1 text-xs font-semibold text-red-600">{errors.cookTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="servings">
                Servings
              </label>
              <input
                id="servings"
                type="number"
                min="1"
                value={form.servings}
                onChange={(e) => update('servings', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.servings && <p className="mt-1 text-xs font-semibold text-red-600">{errors.servings}</p>}
            </div>
          </div>
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Ingredients</h3>
          <p className="mt-0.5 text-xs text-muted">Unlimited, reorderable.</p>
          <div className="mt-4">
            <IngredientsEditor value={form.ingredients} onChange={(v) => update('ingredients', v)} />
          </div>
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Instructions</h3>
          <p className="mt-0.5 text-xs text-muted">Step-by-step, unlimited, reorderable.</p>
          <div className="mt-4">
            <InstructionsEditor value={form.instructions} onChange={(v) => update('instructions', v)} />
          </div>
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Nutrition</h3>
          <p className="mt-0.5 text-xs text-muted">Dynamic rows — add whatever nutrition facts apply.</p>
          <div className="mt-4">
            <NutritionEditor value={form.nutrition} onChange={(v) => update('nutrition', v)} />
          </div>
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">SEO</h3>
          <p className="mt-0.5 text-xs text-muted">Optional overrides for search engines and social shares.</p>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="seoTitle">
            SEO title
          </label>
          <input
            id="seoTitle"
            type="text"
            value={form.seo.title}
            onChange={(e) => update('seo', { ...form.seo, title: e.target.value })}
            placeholder="Defaults to the recipe name if left blank"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-right text-xs text-muted">{form.seo.title?.length || 0}/70</p>

          <label className="mt-2 block text-sm font-semibold text-ink" htmlFor="metaDescription">
            Meta description
          </label>
          <textarea
            id="metaDescription"
            rows={2}
            value={form.seo.metaDescription}
            onChange={(e) => update('seo', { ...form.seo, metaDescription: e.target.value })}
            placeholder="Shown under the title in search results"
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-right text-xs text-muted">{form.seo.metaDescription?.length || 0}/160</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Publish</h3>
          <p className="mt-0.5 mb-4 text-xs text-muted">
            Current status:{' '}
            <span className="font-semibold capitalize text-ink">{form.status}</span>
          </p>

          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={submitting !== null}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary px-6 py-2.5 font-display text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary hover:text-white disabled:opacity-60"
          >
            {submitting === 'draft' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save as draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('published')}
            disabled={submitting !== null}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting === 'published' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {form.status === 'published' && isEdit ? 'Update & keep published' : 'Publish'}
          </button>

          <label className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-line px-3.5 py-2.5">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
              <Star size={15} className={form.featured ? 'fill-current text-accent-dark' : 'text-muted'} aria-hidden="true" />
              Featured
            </span>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => update('featured', e.target.checked)}
              className="h-4 w-4 rounded border-line text-primary focus:ring-primary/20"
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="displayOrder">
            Display order
          </label>
          <input
            id="displayOrder"
            type="number"
            value={form.displayOrder}
            onChange={(e) => update('displayOrder', e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-xs text-muted">Lower numbers appear first</p>
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="mb-3 font-display text-sm font-bold text-primary-dark">Featured image</h3>
          <ImageUploadField
            value={form.featuredImage}
            onChange={(image) => update('featuredImage', image)}
            uploadUrl="/api/admin/recipes/upload"
          />
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="mb-3 font-display text-sm font-bold text-primary-dark">Gallery</h3>
          <p className="mb-3 -mt-2 text-xs text-muted">Optional — extra photos shown on the detail page.</p>
          <GalleryUpload value={form.gallery} onChange={(v) => update('gallery', v)} />
        </div>
      </div>
    </div>
  );
}
