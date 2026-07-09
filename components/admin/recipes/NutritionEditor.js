'use client';

import { Plus, Trash2 } from 'lucide-react';

/**
 * Add / edit / delete rows of { label, value } nutrition facts — deliberately
 * NOT a fixed set of fields (Calories/Protein/...), per the CRS ("do NOT
 * hardcode nutrition fields... admin should be able to manage nutrition rows
 * dynamically"). `value` is an array of { label, value } objects; array
 * order is display order, same convention as IngredientsEditor.js.
 */
export default function NutritionEditor({ value, onChange }) {
  const rows = value || [];

  function updateAt(index, field, text) {
    onChange(rows.map((row, i) => (i === index ? { ...row, [field]: text } : row)));
  }

  function removeAt(index) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...rows, { label: '', value: '' }]);
  }

  return (
    <div>
      {rows.length === 0 && (
        <p className="text-sm text-muted">No nutrition info yet. Add the first row below.</p>
      )}
      <ul className="space-y-2">
        {rows.map((row, index) => (
          // eslint-disable-next-line react/no-array-index-key -- rows have no stable id
          <li key={index} className="flex items-center gap-1.5">
            <input
              type="text"
              value={row.label || ''}
              onChange={(e) => updateAt(index, 'label', e.target.value)}
              placeholder="Calories"
              className="w-1/2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="text"
              value={row.value || ''}
              onChange={(e) => updateAt(index, 'value', e.target.value)}
              placeholder="180 kcal"
              className="w-1/2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => removeAt(index)}
              title="Delete row"
              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={addRow}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-primary hover:border-primary"
      >
        <Plus size={14} />
        Add nutrition row
      </button>
    </div>
  );
}
