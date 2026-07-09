'use client';

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

/**
 * Add / edit / delete / reorder controls for a recipe's ingredients list —
 * unlimited, array order = display order. Directly mirrors
 * components/admin/membership/BenefitsEditor.js's shape/behaviour (same
 * plain-string-array convention), just with recipe-appropriate copy.
 */
export default function IngredientsEditor({ value, onChange }) {
  const ingredients = value || [];

  function updateAt(index, text) {
    onChange(ingredients.map((item, i) => (i === index ? text : item)));
  }

  function removeAt(index) {
    onChange(ingredients.filter((_, i) => i !== index));
  }

  function moveAt(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= ingredients.length) return;
    const next = [...ingredients];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addIngredient() {
    onChange([...ingredients, '']);
  }

  return (
    <div>
      {ingredients.length === 0 && (
        <p className="text-sm text-muted">No ingredients yet. Add the first one below.</p>
      )}
      <ul className="space-y-2">
        {ingredients.map((ingredient, index) => (
          // eslint-disable-next-line react/no-array-index-key -- ingredients are plain strings with no stable id
          <li key={index} className="flex items-center gap-1.5">
            <input
              type="text"
              value={ingredient}
              onChange={(e) => updateAt(index, e.target.value)}
              placeholder="2 cups paneer, cubed"
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
              disabled={index === ingredients.length - 1}
              title="Move down"
              className="rounded-lg p-1.5 text-muted hover:bg-sage disabled:opacity-30"
            >
              <ChevronDown size={16} />
            </button>
            <button
              type="button"
              onClick={() => removeAt(index)}
              title="Delete ingredient"
              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={addIngredient}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-primary hover:border-primary"
      >
        <Plus size={14} />
        Add ingredient
      </button>
    </div>
  );
}
