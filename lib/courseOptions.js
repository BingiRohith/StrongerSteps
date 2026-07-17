/**
 * Sprint 19.2 — closed option sets for the Courses CMS, same
 * single-source-of-truth pattern as lib/recipeOptions.js/lib/eventOptions.js
 * (shared by model enum validation, admin <select>s, and public label
 * helpers). Category/Tags stay dynamic (see models/CourseCategory.js and
 * Course.tags) — only Difficulty and Lesson Type are closed sets.
 */

export const DIFFICULTY_LEVELS = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
];
export const DIFFICULTY_VALUES = DIFFICULTY_LEVELS.map((d) => d.value);

export function difficultyLabel(value) {
  return DIFFICULTY_LEVELS.find((d) => d.value === value)?.label || value;
}

/**
 * A lesson's `lessonType` determines which media field is relevant
 * (`video`/`pdf`/`image` sub-documents, `externalUrl` for links, or just
 * `body` rich text) — see models/Lesson.js.
 */
export const LESSON_TYPES = [
  { value: 'video', label: 'Video' },
  { value: 'pdf', label: 'PDF' },
  { value: 'image', label: 'Image' },
  { value: 'external_link', label: 'External Link' },
  { value: 'text', label: 'Text' },
];
export const LESSON_TYPE_VALUES = LESSON_TYPES.map((t) => t.value);

export function lessonTypeLabel(value) {
  return LESSON_TYPES.find((t) => t.value === value)?.label || value;
}
