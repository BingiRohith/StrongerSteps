'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';
import ImageUploadField from '@/components/admin/infographics/ImageUploadField';

const EMPTY_IMAGE = { url: '', alt: '' };

export default function HeroSectionForm({ data, onSave }) {
  const [form, setForm] = useState({
    heading: data?.heading || '',
    subHeading: data?.subHeading || '',
    description: data?.description || '',
    primaryButtonText: data?.primaryButtonText || '',
    primaryButtonUrl: data?.primaryButtonUrl || '',
    secondaryButtonText: data?.secondaryButtonText || '',
    secondaryButtonUrl: data?.secondaryButtonUrl || '',
    illustrationImage: { ...EMPTY_IMAGE, ...data?.illustrationImage },
    backgroundImage: { ...EMPTY_IMAGE, ...data?.backgroundImage },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setError('');
    setSaved(false);
    if (!form.heading.trim()) {
      setError('Heading is required');
      return;
    }
    setSaving(true);
    const result = await onSave(form);
    setSaving(false);
    if (result.ok) {
      setSaved(true);
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Copy</h3>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="heading">
            Heading
          </label>
          <textarea
            id="heading"
            rows={2}
            value={form.heading}
            onChange={(e) => update('heading', e.target.value)}
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="subHeading">
            Sub heading
          </label>
          <input
            id="subHeading"
            type="text"
            value={form.subHeading}
            onChange={(e) => update('subHeading', e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="description">
            Description
          </label>
          <input
            id="description"
            type="text"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Buttons</h3>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="primaryButtonText">
                Primary button text
              </label>
              <input
                id="primaryButtonText"
                type="text"
                value={form.primaryButtonText}
                onChange={(e) => update('primaryButtonText', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="primaryButtonUrl">
                Primary button URL
              </label>
              <input
                id="primaryButtonUrl"
                type="text"
                value={form.primaryButtonUrl}
                onChange={(e) => update('primaryButtonUrl', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="secondaryButtonText">
                Secondary button text
              </label>
              <input
                id="secondaryButtonText"
                type="text"
                value={form.secondaryButtonText}
                onChange={(e) => update('secondaryButtonText', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="secondaryButtonUrl">
                Secondary button URL
              </label>
              <input
                id="secondaryButtonUrl"
                type="text"
                value={form.secondaryButtonUrl}
                onChange={(e) => update('secondaryButtonUrl', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="mb-3 font-display text-sm font-bold text-primary-dark">Hero illustration</h3>
          <p className="mb-3 -mt-2 text-xs text-muted">
            Optional — replaces the default step illustration when set.
          </p>
          <ImageUploadField
            value={form.illustrationImage}
            onChange={(illustrationImage) => update('illustrationImage', illustrationImage)}
            uploadUrl="/api/admin/homepage/upload"
          />
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="mb-3 font-display text-sm font-bold text-primary-dark">Background</h3>
          <p className="mb-3 -mt-2 text-xs text-muted">
            Optional — replaces the default background when set.
          </p>
          <ImageUploadField
            value={form.backgroundImage}
            onChange={(backgroundImage) => update('backgroundImage', backgroundImage)}
            uploadUrl="/api/admin/homepage/upload"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Hero
          </button>
        </div>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-dark">
            <CheckCircle2 size={16} />
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
