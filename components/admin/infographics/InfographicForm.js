'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Save, Send } from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import ProtectedImageUploadField from './ProtectedImageUploadField';
import PdfUpload from './PdfUpload';
import CategoryField from './CategoryField';
import { slugify } from '@/lib/slugify';

const EMPTY_INFOGRAPHIC = {
  title: '',
  slug: '',
  description: '',
  category: '',
  thumbnailImage: { url: '', alt: '' },
  fullImage: { url: '', alt: '' },
  pdf: { url: '', filename: '' },
  seo: { title: '', metaDescription: '' },
  status: 'draft',
};

export default function InfographicForm({ infographicId, initialData }) {
  const router = useRouter();
  const isEdit = Boolean(infographicId);

  const [form, setForm] = useState(() => ({
    ...EMPTY_INFOGRAPHIC,
    ...initialData,
    thumbnailImage: { ...EMPTY_INFOGRAPHIC.thumbnailImage, ...initialData?.thumbnailImage },
    fullImage: { ...EMPTY_INFOGRAPHIC.fullImage, ...initialData?.fullImage },
    pdf: { ...EMPTY_INFOGRAPHIC.pdf, ...initialData?.pdf },
    seo: { ...EMPTY_INFOGRAPHIC.seo, ...initialData?.seo },
  }));
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(null); // 'draft' | 'published' | null
  const [submitError, setSubmitError] = useState('');

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
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.category.trim()) next.category = 'Category is required';
    if (form.description && form.description.length > 500)
      next.description = 'Description must be 500 characters or fewer';
    if (form.seo?.metaDescription && form.seo.metaDescription.length > 160)
      next.metaDescription = 'Meta description must be 160 characters or fewer';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(status) {
    setSubmitError('');
    if (!validate()) return;

    setSubmitting(status);
    try {
      const payload = { ...form, status };
      const res = await fetch(
        isEdit ? `/api/admin/infographics/${infographicId}` : '/api/admin/infographics',
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

      router.push('/admin/infographics');
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
          <label className="block text-sm font-semibold text-ink" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Understanding Delirium"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.title && <p className="mt-1 text-xs font-semibold text-red-600">{errors.title}</p>}

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="slug">
            Slug
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-sm text-muted">/infographics/</span>
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
                Reset to title
              </button>
            )}
          </div>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="A short summary shown on the infographic card"
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.description ? (
              <p className="text-xs font-semibold text-red-600">{errors.description}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-muted">{form.description?.length || 0}/500</p>
          </div>

          <label className="mt-4 block text-sm font-semibold text-ink">Category</label>
          <div className="mt-1.5">
            <CategoryField value={form.category} onChange={(category) => update('category', category)} />
          </div>
          {errors.category && <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.category}</p>}
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
            placeholder="Defaults to the infographic title if left blank"
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
          <div className="mt-1 flex items-center justify-between">
            {errors.metaDescription ? (
              <p className="text-xs font-semibold text-red-600">{errors.metaDescription}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-muted">{form.seo.metaDescription?.length || 0}/160</p>
          </div>
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
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="mb-3 font-display text-sm font-bold text-primary-dark">Thumbnail image</h3>
          <p className="mb-3 text-xs text-muted">Shown on the infographic card in the Knowledge Center.</p>
          <ImageUploadField
            value={form.thumbnailImage}
            onChange={(thumbnailImage) => update('thumbnailImage', thumbnailImage)}
          />
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="mb-3 font-display text-sm font-bold text-primary-dark">Full image</h3>
          <p className="mb-3 text-xs text-muted">
            Shown when a visitor opens/views the infographic. Protected — downloading the full-resolution
            image requires email/mobile verification.
          </p>
          <ProtectedImageUploadField
            value={form.fullImage}
            onChange={(fullImage) => update('fullImage', fullImage)}
            infographicId={infographicId}
          />
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="mb-3 font-display text-sm font-bold text-primary-dark">PDF (optional)</h3>
          <PdfUpload value={form.pdf} onChange={(pdf) => update('pdf', pdf)} />
        </div>
      </div>
    </div>
  );
}
