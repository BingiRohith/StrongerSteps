'use client';

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

/**
 * Add / edit / delete / reorder controls for a recipe's step-by-step
 * instructions — unlimited, array order = display/step order. Same
 * plain-string-array convention as IngredientsEditor.js /
 * components/admin/membership/BenefitsEditor.js, with a numbered-step
 * presentation since order is meaningful here (not just display order).
 */
export default function InstructionsEditor({ value, onChange }) {
  const instructions = value || [];

  function updateAt(index, text) {
    onChange(instructions.map((item, i) => (i === index ? text : item)));
  }

  function removeAt(index) {
    onChange(instructions.filter((_, i) => i !== index));
  }

  function moveAt(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= instructions.length) return;
    const next = [...instructions];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addStep() {
    onChange([...instructions, '']);
  }

  return (
    <div>
      {instructions.length === 0 && (
        <p className="text-sm text-muted">No steps yet. Add the first one below.</p>
      )}
      <ul className="space-y-2">
        {instructions.map((step, index) => (
          // eslint-disable-next-line react/no-array-index-key -- steps are plain strings with no stable id
          <li key={index} className="flex items-start gap-1.5">
            <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-bold text-primary-dark">
              {index + 1}
            </span>
            <textarea
              rows={2}
              value={step}
              onChange={(e) => updateAt(index, e.target.value)}
              placeholder="Heat oil in a pan over medium heat..."
              className="w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex shrink-0 flex-col gap-0.5">
              <button
                type="button"
                onClick={() => moveAt(index, -1)}
                disabled={index === 0}
                title="Move up"
                className="rounded-lg p-1.5 text-muted hover:bg-sage disabled:opacity-30"
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                onClick={() => moveAt(index, 1)}
                disabled={index === instructions.length - 1}
                title="Move down"
                className="rounded-lg p-1.5 text-muted hover:bg-sage disabled:opacity-30"
              >
                <ChevronDown size={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => removeAt(index)}
              title="Delete step"
              className="mt-1.5 rounded-lg p-1.5 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={addStep}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-primary hover:border-primary"
      >
        <Plus size={14} />
        Add step
      </button>
    </div>
  );
}
