/**
 * Sprint 19.4 — closed option sets for the Tools CMS, same
 * single-source-of-truth pattern as lib/courseOptions.js/lib/resourceOptions.js
 * (shared by model enum validation, admin <select>s, and public label
 * helpers). Category/Tags stay dynamic (see models/ToolCategory.js and
 * Tool.tags) — only Tool Type and Question Type are closed sets.
 */

export const TOOL_TYPES = [
  { value: 'assessment', label: 'Assessment' },
  { value: 'calculator', label: 'Calculator' },
];
export const TOOL_TYPE_VALUES = TOOL_TYPES.map((t) => t.value);

export function toolTypeLabel(value) {
  return TOOL_TYPES.find((t) => t.value === value)?.label || value;
}

/**
 * A question's `questionType` determines which fields on models/ToolQuestion.js
 * are relevant: `options[]` (radio/checkbox/yesno) or `numericConfig`
 * (numeric) — see that model's header comment.
 */
export const QUESTION_TYPES = [
  { value: 'radio', label: 'Single choice (radio)' },
  { value: 'checkbox', label: 'Multiple choice (checkbox)' },
  { value: 'yesno', label: 'Yes / No' },
  { value: 'numeric', label: 'Numeric' },
];
export const QUESTION_TYPE_VALUES = QUESTION_TYPES.map((t) => t.value);

export function questionTypeLabel(value) {
  return QUESTION_TYPES.find((t) => t.value === value)?.label || value;
}
