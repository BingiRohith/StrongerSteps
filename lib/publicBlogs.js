import connectDB from '@/lib/db';
import Blog from '@/models/Blog';
import Category from '@/models/Category'; // eslint-disable-line no-unused-vars -- registers the ref before populate
import User from '@/models/User'; // eslint-disable-line no-unused-vars -- registers the ref before .populate('author', ...) in getBlogBySlug()

/**
 * Read-only query helpers for the *public* blog pages (Knowledge Center
 * listing + `/knowledge-center/blogs/[slug]`) and the public `/api/blogs`
 * route. Every query here is hard-scoped to `status: 'published'` — drafts
 * are never reachable from the public site, only from the existing admin
 * routes in `app/api/admin/blogs/*`.
 *
 * These are intentionally separate from `app/api/admin/blogs/*` (which stay
 * untouched) so nothing about the admin authoring flow changes.
 */

const LIST_PROJECTION = '-content'; // list/card views never need the full HTML body

function serialize(doc) {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

/**
 * Published blogs, newest first, with optional text search / category
 * filter and pagination. Powers both the initial server-rendered grid and
 * the client-side search/filter/"load more" requests to `/api/blogs`.
 */
export async function getPublishedBlogs({ page = 1, limit = 9, search = '', category = '' } = {}) {
  await connectDB();

  const query = { status: 'published' };
  if (category) query.category = category;
  if (search?.trim()) query.$text = { $search: search.trim() };

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(24, Math.max(1, limit));

  const [blogs, total] = await Promise.all([
    Blog.find(query)
      .select(LIST_PROJECTION)
      .populate('category', 'name slug')
      .sort({ featured: -1, publishedAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Blog.countDocuments(query),
  ]);

  return {
    blogs: serialize(blogs),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

/** Distinct categories that have at least one published blog — powers the filter chips. */
export async function getBlogCategories() {
  await connectDB();

  const categoryIds = await Blog.distinct('category', { status: 'published' });
  if (!categoryIds.length) return [];

  const categories = await Category.find({ _id: { $in: categoryIds } })
    .select('name slug')
    .sort({ name: 1 })
    .lean();

  return serialize(categories);
}

/** A single published blog by slug, with full content for the detail page. */
export async function getBlogBySlug(slug) {
  await connectDB();

  const blog = await Blog.findOne({ slug, status: 'published' })
    .populate('category', 'name slug')
    .populate('author', 'name')
    .lean();

  return serialize(blog);
}

/**
 * Previous/next published blog relative to `blog`, ordered by publish
 * date. `blog` is expected to be the already-serialized object returned by
 * `getBlogBySlug` (so `publishedAt` is an ISO string — Mongoose casts it
 * back to a Date for the query).
 */
export async function getAdjacentBlogs(blog) {
  await connectDB();

  const base = { status: 'published', _id: { $ne: blog._id } };

  const [prev, next] = await Promise.all([
    Blog.findOne({ ...base, publishedAt: { $lt: blog.publishedAt } })
      .select('title slug coverImage')
      .sort({ publishedAt: -1 })
      .lean(),
    Blog.findOne({ ...base, publishedAt: { $gt: blog.publishedAt } })
      .select('title slug coverImage')
      .sort({ publishedAt: 1 })
      .lean(),
  ]);

  return { prev: serialize(prev), next: serialize(next) };
}

/** Up to `limit` other published blogs in the same category. */
export async function getRelatedBlogs(blog, limit = 3) {
  await connectDB();

  const categoryId = blog?.category?._id || blog?.category;
  if (!categoryId) return [];

  const related = await Blog.find({
    status: 'published',
    category: categoryId,
    slug: { $ne: blog.slug },
  })
    .select(LIST_PROJECTION)
    .populate('category', 'name slug')
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  return serialize(related);
}
