import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Resource from '@/models/Resource';
import ResourceCategory from '@/models/ResourceCategory'; // eslint-disable-line no-unused-vars -- registers the ref before populate
import ResourceFile from '@/models/ResourceFile';

/**
 * Read-only query helpers for the *public* Resource Library pages
 * (`/resources`, `/resources/[slug]`) and the public `/api/resources`
 * route. Every query here is hard-scoped to `status: 'published',
 * deletedAt: null` — drafts and soft-deleted resources are never reachable
 * from the public site. Mirrors the lib/publicCourses.js pattern exactly.
 *
 * Deliberately does NOT apply per-file access-control redaction — these
 * are plain DB-fetching helpers with no request/actor context, same as
 * every other lib/public*.js module. Callers (app/api/resources/[slug]/route.js,
 * app/resources/[slug]/page.js) apply lib/resourceAccess.js's
 * annotateResourceAccess() afterward, once they have the current actor.
 */

function serialize(doc) {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

const SORT_OPTIONS = {
  'title-asc': { title: 1 },
  newest: { publishedAt: -1 },
  featured: { featured: -1, displayOrder: 1 },
};
const DEFAULT_SORT = { displayOrder: 1, title: 1 };

/** Published resources with optional category (slug)/fileType/tag/text-search/accessLevel filters, sort, and pagination. */
export async function getPublishedResources({
  category = '',
  fileType = '',
  tag = '',
  search = '',
  accessLevel = '',
  featured = false,
  sort = '',
  page = 1,
  limit = 12,
} = {}) {
  await connectDB();

  const query = { status: 'published', deletedAt: null };

  if (category) {
    const categoryDoc = await ResourceCategory.findOne({ slug: category }).select('_id').lean();
    query.category = categoryDoc ? categoryDoc._id : null; // no match -> empty results, not "ignore filter"
  }
  if (fileType) query.fileTypes = fileType;
  if (tag) query.tags = tag.trim().toLowerCase();
  if (accessLevel) query.accessLevel = accessLevel;
  // Sprint 19.3 Phase 4 — a dedicated Featured *filter* (narrows results to
  // only featured resources), distinct from the existing `sort: 'featured'`
  // option (which only reorders, same convention Courses already has).
  if (featured) query.featured = true;
  if (search?.trim()) query.$text = { $search: search.trim() };

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(48, Math.max(1, Number(limit) || 12));
  const sortSpec = SORT_OPTIONS[sort] || DEFAULT_SORT;

  const [resources, total] = await Promise.all([
    Resource.find(query)
      .populate('category', 'name slug')
      .sort(sortSpec)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Resource.countDocuments(query),
  ]);

  return {
    resources: serialize(resources),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

/** Up to `limit` featured, published resources — powers the Resources listing page and the Knowledge Center section. */
export async function getFeaturedResources(limit = 6) {
  await connectDB();

  const resources = await Resource.find({ status: 'published', deletedAt: null, featured: true })
    .populate('category', 'name slug')
    .sort({ displayOrder: 1, publishedAt: -1 })
    .limit(limit)
    .lean();

  return serialize(resources);
}

/** Active resource categories, admin-ordered — same "curated nav, not derived facet" convention as Recipe/Course Categories. */
export async function getActiveResourceCategories() {
  await connectDB();

  const categories = await ResourceCategory.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  return serialize(categories);
}

/** Distinct tags among published resources — powers the search-by-tag filter. */
export async function getResourceTagsFacet() {
  await connectDB();

  const tags = await Resource.distinct('tags', { status: 'published', deletedAt: null });

  return tags.filter(Boolean).sort((a, b) => a.localeCompare(b));
}

/**
 * A single published resource by slug, with its files attached. Files are
 * NOT access-redacted here — see this module's header comment.
 */
export async function getResourceBySlug(slug) {
  await connectDB();

  const resource = await Resource.findOne({ slug, status: 'published', deletedAt: null })
    .populate('category', 'name slug')
    .lean();
  if (!resource) return null;

  const files = await ResourceFile.find({ resource: resource._id, deletedAt: null })
    .sort({ displayOrder: 1 })
    .lean();

  resource.files = files;

  return serialize(resource);
}

/** Up to `limit` other published resources in the same category. */
export async function getRelatedResources(resource, limit = 3) {
  await connectDB();

  const categoryId = resource?.category?._id || resource?.category;
  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) return [];

  const related = await Resource.find({
    status: 'published',
    deletedAt: null,
    category: categoryId,
    slug: { $ne: resource.slug },
  })
    .populate('category', 'name slug')
    .sort({ displayOrder: 1, publishedAt: -1 })
    .limit(limit)
    .lean();

  return serialize(related);
}
