'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';
import CardListEditor from './CardListEditor';

/**
 * Generic section form for the homepage's two icon-card sections — Why It
 * Matters (`listKey="points"`) and Our Vision (`listKey="pillars"`). Both
 * share an identical shape (eyebrow/title/description + a dynamic list of
 * icon cards), so one component drives both tabs instead of duplicating it.
 */
export default function IconSectionForm({ label, listKey, data, onSave }) {
  const [form, setForm] = useState({
    eyebrow: data?.eyebrow || '',
    title: data?.title || '',
    description: data?.description || '',
    [listKey]: data?.[listKey] || [],
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
    if (!form.title.trim()) {
      setError('Title is required');
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
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
        <h3 className="font-display text-sm font-bold text-primary-dark">Section heading</h3>

        <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="eyebrow">
          Eyebrow
        </label>
        <input
          id="eyebrow"
          type="text"
          value={form.eyebrow}
          onChange={(e) => update('eyebrow', e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
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
        <h3 className="font-display text-sm font-bold text-primary-dark">{label} items</h3>
        <p className="mt-0.5 mb-3 text-xs text-muted">
          Shown in order, left to right. Only active items appear on the public homepage.
        </p>
        <CardListEditor
          items={form[listKey]}
          onChange={(items) => update(listKey, items)}
          variant="icon"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save {label}
        </button>
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
