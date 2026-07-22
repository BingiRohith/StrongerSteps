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

/**
 * Sprint 19.5 — formats a course's derived `totalEstimatedDuration`
 * (summed minutes across its lessons, see lib/publicCourses.js) as
 * "1h 30m" / "45m" for display. Returns '' for 0/falsy so callers can
 * simply skip rendering rather than showing "0m".
 */
export function formatCourseDuration(totalMinutes) {
  const minutes = Math.round(Number(totalMinutes) || 0);
  if (minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours === 0) return `${remaining}m`;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}
