'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import ImageUploadField from '@/components/admin/infographics/ImageUploadField';
import { slugify } from '@/lib/slugify';

const EMPTY_CATEGORY = {
  name: '',
  slug: '',
  description: '',
  featuredImage: { url: '', alt: '' },
  displayOrder: 0,
  isActive: true,
};

export default function RecipeCategoryForm({ categoryId, initialData }) {
  const router = useRouter();
  const isEdit = Boolean(categoryId);

  const [form, setForm] = useState(() => ({
    ...EMPTY_CATEGORY,
    ...initialData,
    featuredImage: { ...EMPTY_CATEGORY.featuredImage, ...initialData?.featuredImage },
  }));
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

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
    if (!form.name.trim()) next.name = 'Category name is required';
    if (form.description && form.description.length > 300) {
      next.description = 'Description must be 300 characters or fewer';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    setSubmitError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        displayOrder: Number(form.displayOrder) || 0,
      };
      const res = await fetch(
        isEdit ? `/api/admin/recipe-categories/${categoryId}` : '/api/admin/recipe-categories',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      router.push('/admin/recipe-categories');
      router.refresh();
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.');
      setSubmitting(false);
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
            Name
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Bone & Joint Health"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.name && <p className="mt-1 text-xs font-semibold text-red-600">{errors.name}</p>}

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="slug">
            Slug
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-sm text-muted">/recipes/category/</span>
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

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="A short description shown on the recipes category navigation"
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.description ? (
              <p className="text-xs font-semibold text-red-600">{errors.description}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-muted">{form.description?.length || 0}/300</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Publish</h3>
          <p className="mt-0.5 mb-4 text-xs text-muted">
            Current status:{' '}
            <span className="font-semibold text-ink">{form.isActive ? 'Active' : 'Inactive'}</span>
          </p>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isEdit ? 'Save changes' : 'Create category'}
          </button>

          <label className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-line px-3.5 py-2.5">
            <span className="text-sm font-semibold text-ink">Active</span>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update('isActive', e.target.checked)}
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
          <p className="mt-1 text-xs text-muted">Lower numbers appear first in the category navigation</p>
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="mb-3 font-display text-sm font-bold text-primary-dark">Featured image</h3>
          <p className="mb-3 -mt-2 text-xs text-muted">Optional — shown on the recipes category navigation.</p>
          <ImageUploadField
            value={form.featuredImage}
            onChange={(image) => update('featuredImage', image)}
            uploadUrl="/api/admin/recipe-categories/upload"
          />
        </div>
      </div>
    </div>
  );
}
