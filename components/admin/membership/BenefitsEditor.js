'use client';

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

/**
 * Add / edit / delete / reorder controls for a plan's benefits list —
 * Sprint 11 calls these out as individually manageable, unlike Team's
 * comma-separated `qualifications` text input. `value` is a plain array of
 * benefit strings; order in the array is the display order.
 */
export default function BenefitsEditor({ value, onChange }) {
  const benefits = value || [];

  function updateAt(index, text) {
    onChange(benefits.map((b, i) => (i === index ? text : b)));
  }

  function removeAt(index) {
    onChange(benefits.filter((_, i) => i !== index));
  }

  function moveAt(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= benefits.length) return;
    const next = [...benefits];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addBenefit() {
    onChange([...benefits, '']);
  }

  return (
    <div>
      {benefits.length === 0 && (
        <p className="text-sm text-muted">No benefits yet. Add the first one below.</p>
      )}
      <ul className="space-y-2">
        {benefits.map((benefit, index) => (
          // eslint-disable-next-line react/no-array-index-key -- benefits are plain strings with no stable id
          <li key={index} className="flex items-center gap-1.5">
            <input
              type="text"
              value={benefit}
              onChange={(e) => updateAt(index, e.target.value)}
              placeholder="Weekly health tips for adults 50+"
              className="w-full rounded-lg border border-line bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
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
              disabled={index === benefits.length - 1}
              title="Move down"
              className="rounded-lg p-1.5 text-muted hover:bg-sage disabled:opacity-30"
            >
              <ChevronDown size={16} />
            </button>
            <button
              type="button"
              onClick={() => removeAt(index)}
              title="Delete benefit"
              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={addBenefit}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-primary hover:border-primary"
      >
        <Plus size={14} />
        Add benefit
      </button>
    </div>
  );
}
