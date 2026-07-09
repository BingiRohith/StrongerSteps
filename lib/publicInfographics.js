import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Infographic from '@/models/Infographic';

/**
 * Read-only query helpers for the *public* Knowledge Center Infographics
 * section and the public `/api/infographics` route. Every query here is
 * hard-scoped to `status: 'published'` — drafts are never reachable from
 * the public site, only from the existing admin routes in
 * `app/api/admin/infographics/*`. Mirrors `lib/publicBlogs.js`.
 */

function serialize(doc) {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

/**
 * Published infographics, newest first, with optional text search /
 * category filter and pagination.
 */
export async function getPublishedInfographics({ page = 1, limit = 18, search = '', category = '' } = {}) {
  await connectDB();

  const query = { status: 'published' };
  if (category) query.category = category;
  if (search?.trim()) query.$text = { $search: search.trim() };

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(48, Math.max(1, limit));

  const [infographics, total] = await Promise.all([
    Infographic.find(query)
      .sort({ publishedAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Infographic.countDocuments(query),
  ]);

  return {
    infographics: serialize(infographics),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

/** Distinct categories that have at least one published infographic — powers the filter chips. */
export async function getInfographicCategories() {
  await connectDB();

  const categories = await Infographic.distinct('category', {
    status: 'published',
    category: { $nin: ['', null] },
  });

  return categories.sort((a, b) => a.localeCompare(b));
}

/** A single published infographic by slug — powers the view/preview modal deep-link, if used. */
export async function getInfographicBySlug(slug) {
  await connectDB();

  const infographic = await Infographic.findOne({ slug, status: 'published' }).lean();

  return serialize(infographic);
}

/**
 * A single published infographic by id, unserialized (Mongoose doc, not
 * plain JSON) — used by the preview-image asset route (Sprint 12.5), which
 * only needs the raw fullImage/thumbnailImage sub-documents, not a
 * client-serializable response.
 */
export async function getPublishedInfographicById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  await connectDB();

  return Infographic.findOne({ _id: id, status: 'published' });
}
