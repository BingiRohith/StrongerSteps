/**
 * Tiny dependency-free slugify helper used by models that need a
 * URL-friendly slug generated from a human-readable field (Blog.title,
 * Category.name, ...).
 */
export function slugify(input = '') {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // strip anything that isn't a word char, space, or hyphen
    .replace(/[\s_]+/g, '-') // spaces/underscores -> hyphen
    .replace(/-+/g, '-') // collapse repeated hyphens
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}

/**
 * Given a desired base slug and a lookup function that returns true if a
 * slug is already taken (excluding the current document, if any), returns
 * a guaranteed-unique slug by appending -2, -3, ... as needed.
 */
export async function ensureUniqueSlug(baseSlug, isTaken) {
  let slug = baseSlug || 'untitled';
  let suffix = 2;

  // eslint-disable-next-line no-await-in-loop
  while (await isTaken(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

/**
 * Strips HTML tags and estimates reading time in whole minutes (min. 1)
 * from rich-text blog content, at an average adult reading speed of
 * 200 words/minute.
 */
export function estimateReadingTime(html = '') {
  const text = html.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
