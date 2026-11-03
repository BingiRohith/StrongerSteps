'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import { slugify } from '@/lib/slugify';

const EMPTY_CATEGORY = { name: '', slug: '', description: '' };

/** Shared form for creating and editing blog categories. */
export default function CategoryForm({ categoryId, initialData }) {
  const router = useRouter();
  const isEdit = Boolean(categoryId);
  const [form, setForm] = useState(() => ({ ...EMPTY_CATEGORY, ...initialData }));
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleNameChange(name) {
    setForm((current) => ({
      ...current,
      name,
      slug: slugTouched ? current.slug : slugify(name),
    }));
  }

  function validate() {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Category name is required';
    if (form.name.length > 80) nextErrors.name = 'Name must be 80 characters or fewer';
    if (form.description.length > 300) nextErrors.description = 'Description must be 300 characters or fewer';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/categories/${categoryId}` : '/api/admin/categories', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      router.push('/admin/categories');
      router.refresh();
    } catch {
      setSubmitError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {submitError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <label htmlFor="name" className="block text-sm font-semibold text-ink">Name</label>
          <input
            id="name"
            type="text"
            maxLength={80}
            value={form.name}
            onChange={(event) => handleNameChange(event.target.value)}
            placeholder="Healthy habits"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.name && <p className="mt-1 text-xs font-semibold text-red-600">{errors.name}</p>}

          <label htmlFor="slug" className="mt-4 block text-sm font-semibold text-ink">Slug</label>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-sm text-muted">/knowledge-center/blogs?category=</span>
            <input
              id="slug"
              type="text"
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true);
                update('slug', slugify(event.target.value));
              }}
              placeholder="auto-generated-from-name"
              className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
          <p className="mt-1 text-xs text-muted">Used in category links. It updates automatically until you edit it.</p>

          <label htmlFor="description" className="mt-4 block text-sm font-semibold text-ink">Description</label>
          <textarea
            id="description"
            rows={4}
            maxLength={300}
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder="A short internal description of the articles in this category"
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.description ? <p className="text-xs font-semibold text-red-600">{errors.description}</p> : <span />}
            <p className="text-xs text-muted">{form.description.length}/300</p>
          </div>
        </div>
      </div>

      <div>
        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Save category</h3>
          <p className="mb-4 mt-1 text-xs text-muted">
            The category becomes available immediately in the Blog editor.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isEdit ? 'Save changes' : 'Create category'}
          </button>
        </div>
      </div>
    </form>
  );
}
