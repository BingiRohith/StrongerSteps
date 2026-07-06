'use client';

// Free-text category (see models/Infographic.js for why it isn't a ref to
// Category.js) with a datalist of sensible starting suggestions so authors
// aren't typing from scratch every time — new values are always allowed.
const SUGGESTED_CATEGORIES = [
  'Cognitive Health',
  'Mobility & Falls',
  'Nutrition & Diet',
  'Continence',
  'Caregiving & Safety',
  'Medication Management',
  'Skin & Pressure Care',
  'Sleep',
];

export default function CategoryField({ value, onChange }) {
  return (
    <>
      <input
        list="infographic-category-suggestions"
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Mobility & Falls"
        className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <datalist id="infographic-category-suggestions">
        {SUGGESTED_CATEGORIES.map((cat) => (
          <option key={cat} value={cat} />
        ))}
      </datalist>
    </>
  );
}
