'use client';

import { useState } from 'react';
import { Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { QUESTION_TYPES } from '@/lib/toolOptions';

const EMPTY_OPTION = { label: '', value: '', score: 0 };
const EMPTY_BAND = { min: 0, max: 0, score: 0 };

/**
 * Full edit form for one question, shown inline under its row in
 * ToolBuilder.js — mirrors components/admin/courses/LessonEditorPanel.js's
 * "always operates on an already-created row" shape, but the per-type
 * dynamic content here is scoring configuration (options[]/numericConfig),
 * not file uploads. Every score is a plain number input the admin fills
 * in — this is the CMS surface that makes lib/toolScoring.js fully
 * data-driven with no hardcoded values.
 */
export default function QuestionEditorPanel({ toolId, sectionId, question, onSaved, onClose }) {
  const [form, setForm] = useState(() => ({
    questionText: question.questionText || '',
    helpText: question.helpText || '',
    questionType: question.questionType || 'radio',
    required: question.required !== undefined ? Boolean(question.required) : true,
    options: question.options?.length ? question.options : [{ ...EMPTY_OPTION }, { ...EMPTY_OPTION }],
    numericConfig: {
      min: question.numericConfig?.min ?? 0,
      max: question.numericConfig?.max ?? 100,
      step: question.numericConfig?.step ?? 1,
      unit: question.numericConfig?.unit || '',
      scoreBands: question.numericConfig?.scoreBands?.length
        ? question.numericConfig.scoreBands
        : [{ ...EMPTY_BAND }],
    },
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateOption(index, field, value) {
    update(
      'options',
      form.options.map((o, i) => (i === index ? { ...o, [field]: value } : o))
    );
  }

  function addOption() {
    update('options', [...form.options, { ...EMPTY_OPTION }]);
  }

  function removeOption(index) {
    update('options', form.options.filter((_, i) => i !== index));
  }

  function updateNumericConfig(field, value) {
    update('numericConfig', { ...form.numericConfig, [field]: value });
  }

  function updateScoreBand(index, field, value) {
    updateNumericConfig(
      'scoreBands',
      form.numericConfig.scoreBands.map((b, i) => (i === index ? { ...b, [field]: value } : b))
    );
  }

  function addScoreBand() {
    updateNumericConfig('scoreBands', [...form.numericConfig.scoreBands, { ...EMPTY_BAND }]);
  }

  function removeScoreBand(index) {
    updateNumericConfig(
      'scoreBands',
      form.numericConfig.scoreBands.filter((_, i) => i !== index)
    );
  }

  const basePath = `/api/admin/tools/${toolId}/sections/${sectionId}/questions/${question._id}`;

  async function handleSave() {
    setError('');
    if (!form.questionText.trim()) {
      setError('Question text is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        options: form.options.map((o) => ({ ...o, score: Number(o.score) || 0 })),
        numericConfig: {
          ...form.numericConfig,
          min: Number(form.numericConfig.min) || 0,
          max: Number(form.numericConfig.max) || 0,
          step: Number(form.numericConfig.step) || 1,
          scoreBands: form.numericConfig.scoreBands.map((b) => ({
            min: Number(b.min) || 0,
            max: Number(b.max) || 0,
            score: Number(b.score) || 0,
          })),
        },
      };
      const res = await fetch(basePath, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to save question');
        return;
      }
      onSaved(data.question);
    } finally {
      setSaving(false);
    }
  }

  const usesOptions = ['radio', 'checkbox', 'yesno'].includes(form.questionType);

  return (
    <div className="mt-2 rounded-lg border border-primary/30 bg-white p-4">
      {error && <p className="mb-3 text-xs font-semibold text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-ink">Question text</label>
          <input
            type="text"
            value={form.questionText}
            onChange={(e) => update('questionText', e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-ink">Help text</label>
          <input
            type="text"
            value={form.helpText}
            onChange={(e) => update('helpText', e.target.value)}
            placeholder="Optional clarifying note shown under the question"
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink">Question type</label>
          <select
            value={form.questionType}
            onChange={(e) => update('questionType', e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <label className="mt-1 flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 sm:mt-5">
          <span className="text-xs font-semibold text-ink">Required</span>
          <input
            type="checkbox"
            checked={form.required}
            onChange={(e) => update('required', e.target.checked)}
            className="h-4 w-4 rounded border-line text-primary focus:ring-primary/20"
          />
        </label>
      </div>

      {usesOptions && (
        <div className="mt-4 rounded-lg border border-dashed border-line p-3">
          <p className="text-xs font-semibold text-ink">
            Options {form.questionType === 'checkbox' && '(scores sum when multiple are selected)'}
          </p>
          <div className="mt-2 space-y-2">
            {form.options.map((option, index) => (
              // eslint-disable-next-line react/no-array-index-key -- options have no stable id until saved
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option.label}
                  onChange={(e) => updateOption(index, 'label', e.target.value)}
                  placeholder="Label (e.g. Yes)"
                  className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-xs text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="text"
                  value={option.value}
                  onChange={(e) => updateOption(index, 'value', e.target.value)}
                  placeholder="Value (e.g. yes)"
                  className="w-28 rounded-lg border border-line bg-white px-3 py-2 text-xs text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="number"
                  value={option.score}
                  onChange={(e) => updateOption(index, 'score', e.target.value)}
                  placeholder="Score"
                  className="w-20 rounded-lg border border-line bg-white px-3 py-2 text-xs text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="rounded p-1.5 text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary"
          >
            <Plus size={13} />
            Add option
          </button>
        </div>
      )}

      {form.questionType === 'numeric' && (
        <div className="mt-4 rounded-lg border border-dashed border-line p-3">
          <p className="text-xs font-semibold text-ink">Numeric range</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div>
              <label className="block text-[11px] font-semibold text-muted">Min</label>
              <input
                type="number"
                value={form.numericConfig.min}
                onChange={(e) => updateNumericConfig('min', e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted">Max</label>
              <input
                type="number"
                value={form.numericConfig.max}
                onChange={(e) => updateNumericConfig('max', e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted">Step</label>
              <input
                type="number"
                value={form.numericConfig.step}
                onChange={(e) => updateNumericConfig('step', e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted">Unit</label>
              <input
                type="text"
                value={form.numericConfig.unit}
                onChange={(e) => updateNumericConfig('unit', e.target.value)}
                placeholder="e.g. falls"
                className="mt-1 w-full rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-primary"
              />
            </div>
          </div>

          <p className="mt-3 text-xs font-semibold text-ink">Score bands</p>
          <div className="mt-2 space-y-2">
            {form.numericConfig.scoreBands.map((band, index) => (
              // eslint-disable-next-line react/no-array-index-key -- bands have no stable id until saved
              <div key={index} className="flex items-center gap-2">
                <input
                  type="number"
                  value={band.min}
                  onChange={(e) => updateScoreBand(index, 'min', e.target.value)}
                  placeholder="From"
                  className="w-20 rounded-lg border border-line bg-white px-3 py-2 text-xs text-ink outline-none focus:border-primary"
                />
                <span className="text-xs text-muted">to</span>
                <input
                  type="number"
                  value={band.max}
                  onChange={(e) => updateScoreBand(index, 'max', e.target.value)}
                  placeholder="To"
                  className="w-20 rounded-lg border border-line bg-white px-3 py-2 text-xs text-ink outline-none focus:border-primary"
                />
                <span className="text-xs text-muted">score</span>
                <input
                  type="number"
                  value={band.score}
                  onChange={(e) => updateScoreBand(index, 'score', e.target.value)}
                  className="w-20 rounded-lg border border-line bg-white px-3 py-2 text-xs text-ink outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => removeScoreBand(index)}
                  className="rounded p-1.5 text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addScoreBand}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary"
          >
            <Plus size={13} />
            Add score band
          </button>
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs font-semibold text-muted hover:bg-sage"
        >
          <X size={13} />
          Close
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Save question
        </button>
      </div>
    </div>
  );
}
