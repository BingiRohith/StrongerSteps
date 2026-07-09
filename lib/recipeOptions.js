/**
 * Closed difficulty set for the Recipes CMS — mirrors the
 * lib/productCategories.js / lib/membershipOptions.js pattern (single
 * source of truth shared by models/Recipe.js enum validation, the admin
 * RecipeForm's <select>, and the public recipes page's filter/label
 * helpers). Category and Tags stay dynamic (see models/RecipeCategory.js
 * and Recipe.tags) — only Difficulty is a small closed set per the CRS.
 */

export const DIFFICULTY_LEVELS = [
  { value: 'Easy', label: 'Easy' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Hard', label: 'Hard' },
];

export const DIFFICULTY_VALUES = DIFFICULTY_LEVELS.map((d) => d.value);

export function difficultyLabel(value) {
  return DIFFICULTY_LEVELS.find((d) => d.value === value)?.label || value;
}
