/**
 * Sprint 19.3 — closed option set for the Resource Library's file types,
 * same single-source-of-truth pattern as lib/courseOptions.js (shared by
 * model enum validation, admin <select>s, and public label/icon helpers).
 * Category/Tags/Keywords stay dynamic (see models/ResourceCategory.js and
 * Resource.tags/keywords) — only File Type is a closed set.
 */

export const FILE_TYPES = [
  { value: 'pdf', label: 'PDF' },
  { value: 'image', label: 'Image' },
  { value: 'word', label: 'Word Document' },
  { value: 'excel', label: 'Excel Spreadsheet' },
  { value: 'powerpoint', label: 'PowerPoint' },
  { value: 'zip', label: 'ZIP Archive' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
  { value: 'external_link', label: 'External Link' },
];
export const FILE_TYPE_VALUES = FILE_TYPES.map((t) => t.value);

export function fileTypeLabel(value) {
  return FILE_TYPES.find((t) => t.value === value)?.label || value;
}

/** Which upload `mediaType` (lib/privateUpload.js) a given fileType maps onto — external_link has none. */
export const MEDIA_TYPE_BY_FILE_TYPE = {
  pdf: 'pdf',
  image: 'image',
  word: 'document',
  excel: 'document',
  powerpoint: 'document',
  zip: 'zip',
  audio: 'audio',
  video: 'video',
};
