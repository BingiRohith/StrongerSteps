'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Save, Send, Star } from 'lucide-react';
import ImageUploadField from '@/components/admin/infographics/ImageUploadField';
import TagsInput from '@/components/admin/blogs/TagsInput';
import { slugify } from '@/lib/slugify';
import { ACCESS_LEVELS } from '@/lib/access/accessLevels';

// Mirrors components/admin/courses/CourseForm.js's structure/pattern.
const EMPTY_RESOURCE = {
  title: '',
  slug: '',
  description: '',
  longDescription: '',
  thumbnail: { url: '', alt: '' },
  banner: { url: '', alt: '' },
  category: '',
  tags: [],
  keywords: [],
  author: '',
  estimatedReadingTime: 0,
  language: 'English',
  featured: false,
  displayOrder: 0,
  accessLevel: ACCESS_LEVELS.PUBLIC,
  status: 'draft',
  seo: { title: '', metaDescription: '' },
};

export default function ResourceForm({ resourceId, initialData }) {
  const router = useRouter();
  const isEdit = Boolean(resourceId);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [form, setForm] = useState(() => ({
    ...EMPTY_RESOURCE,
    ...initialData,
    category: initialData?.category?._id || initialData?.category || '',
    thumbnail: { ...EMPTY_RESOURCE.thumbnail, ...initialData?.thumbnail },
    banner: { ...EMPTY_RESOURCE.banner, ...initialData?.banner },
    seo: { ...EMPTY_RESOURCE.seo, ...initialData?.seo },
  }));
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(null); // 'draft' | 'published' | null
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/resource-categories');
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

  function handleTitleChange(title) {
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugTouched ? prev.slug : slugify(title),
    }));
  }

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = 'Resource title is required';
    if (!form.category) next.category = 'Category is required';
    if (form.description && form.description.length > 2000) {
      next.description = 'Short description must be 2000 characters or fewer';
    }
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
        displayOrder: Number(form.displayOrder) || 0,
        estimatedReadingTime: Math.max(0, Number(form.estimatedReadingTime) || 0),
      };
      const res = await fetch(isEdit ? `/api/admin/resources/${resourceId}` : '/api/admin/resources', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Something went wrong. Please try again.');
        setSubmitting(null);
        return;
      }

      if (isEdit) {
        router.push('/admin/resources');
        router.refresh();
      } else {
        // A brand-new resource has no files yet — send the admin straight
        // to the files manager instead of back to the list.
        router.push(`/admin/resources/${data.resource._id}/files`);
      }
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
          <label className="block text-sm font-semibold text-ink" htmlFor="title">
            Resource title
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Healthy Ageing Guide"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.title && <p className="mt-1 text-xs font-semibold text-red-600">{errors.title}</p>}

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="slug">
            Slug
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-sm text-muted">/resources/</span>
            <input
              id="slug"
              type="text"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update('slug', slugify(e.target.value));
              }}
              placeholder="auto-generated-from-title"
              className="flex-1 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {slugTouched && (
              <button
                type="button"
                onClick={() => {
                  setSlugTouched(false);
                  update('slug', slugify(form.title));
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
          {errors.category && <p className="mt-1 text-xs font-semibold text-red-600">{errors.category}</p>}
          {!categoriesLoading && categories.length === 0 && (
            <p className="mt-1 text-xs text-muted">
              No resource categories yet — create one first from Resource Categories.
            </p>
          )}

          <label className="mt-4 block text-sm font-semibold text-ink">Tags</label>
          <p className="mt-0.5 text-xs text-muted">Shown as filter chips on the public Resources page.</p>
          <div className="mt-1.5">
            <TagsInput value={form.tags} onChange={(tags) => update('tags', tags)} />
          </div>

          <label className="mt-4 block text-sm font-semibold text-ink">Keywords</label>
          <p className="mt-0.5 text-xs text-muted">Search-only — not shown as filter chips.</p>
          <div className="mt-1.5">
            <TagsInput value={form.keywords} onChange={(keywords) => update('keywords', keywords)} />
          </div>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="description">
            Short description
          </label>
          <textarea
            id="description"
            rows={2}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="A short summary shown on resource cards"
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.description && <p className="mt-1 text-xs font-semibold text-red-600">{errors.description}</p>}

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="longDescription">
            Long description
          </label>
          <textarea
            id="longDescription"
            rows={6}
            value={form.longDescription}
            onChange={(e) => update('longDescription', e.target.value)}
            placeholder="The full overview shown on the resource detail page"
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Details</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="author">
                Author
              </label>
              <input
                id="author"
                type="text"
                value={form.author}
                onChange={(e) => update('author', e.target.value)}
                placeholder="Dr. Priya Nair"
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="estimatedReadingTime">
                Reading time (min)
              </label>
              <input
                id="estimatedReadingTime"
                type="number"
                min="0"
                value={form.estimatedReadingTime}
                onChange={(e) => update('estimatedReadingTime', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="language">
                Language
              </label>
              <input
                id="language"
                type="text"
                value={form.language}
                onChange={(e) => update('language', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
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
            placeholder="Defaults to the resource title if left blank"
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
            Current status: <span className="font-semibold capitalize text-ink">{form.status}</span>
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
            {submitting === 'published' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
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
          <h3 className="font-display text-sm font-bold text-primary-dark">Access level</h3>
          <p className="mt-0.5 mb-3 text-xs text-muted">
            Informational at this level — always visible on the public listing/detail page once
            published. Each file in the Files manager carries its own access level, which is what
            actually gates that file&apos;s download.
          </p>
          <select
            value={form.accessLevel}
            onChange={(e) => update('accessLevel', e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {Object.values(ACCESS_LEVELS).map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="mb-3 font-display text-sm font-bold text-primary-dark">Thumbnail</h3>
          <ImageUploadField
            value={form.thumbnail}
            onChange={(image) => update('thumbnail', image)}
            uploadUrl="/api/admin/resources/upload"
          />
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="mb-3 font-display text-sm font-bold text-primary-dark">Banner</h3>
          <p className="mb-3 -mt-2 text-xs text-muted">Optional — wide hero image for the resource detail page.</p>
          <ImageUploadField
            value={form.banner}
            onChange={(image) => update('banner', image)}
            uploadUrl="/api/admin/resources/upload"
          />
        </div>
      </div>
    </div>
  );
}
