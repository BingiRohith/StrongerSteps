'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';
import ImageUploadField from '@/components/admin/infographics/ImageUploadField';

export default function MembershipCtaSectionForm({ data, onSave }) {
  const [form, setForm] = useState({
    heading: data?.heading || '',
    description: data?.description || '',
    buttonText: data?.buttonText || '',
    buttonUrl: data?.buttonUrl || '',
    backgroundImage: { url: '', alt: '', ...data?.backgroundImage },
    active: data?.active !== false,
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
          <input
            id="heading"
            type="text"
            value={form.heading}
            onChange={(e) => update('heading', e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={2}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Button</h3>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="buttonText">
                Button text
              </label>
              <input
                id="buttonText"
                type="text"
                value={form.buttonText}
                onChange={(e) => update('buttonText', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="buttonUrl">
                Button URL
              </label>
              <input
                id="buttonUrl"
                type="text"
                value={form.buttonUrl}
                onChange={(e) => update('buttonUrl', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="mb-3 font-display text-sm font-bold text-primary-dark">Background image</h3>
          <p className="mb-3 -mt-2 text-xs text-muted">Optional.</p>
          <ImageUploadField
            value={form.backgroundImage}
            onChange={(backgroundImage) => update('backgroundImage', backgroundImage)}
            uploadUrl="/api/admin/homepage/upload"
          />
        </div>

        <label className="flex items-center justify-between gap-3 rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <span className="text-sm font-semibold text-ink">Show on homepage</span>
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => update('active', e.target.checked)}
            className="h-4 w-4 rounded border-line text-primary focus:ring-primary/20"
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Membership CTA
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
