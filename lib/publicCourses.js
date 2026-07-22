import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import CourseCategory from '@/models/CourseCategory'; // eslint-disable-line no-unused-vars -- registers the ref before populate
import Section from '@/models/Section';
import Lesson from '@/models/Lesson';

/**
 * Read-only query helpers for the *public* Courses pages (`/courses`,
 * `/courses/[slug]`) and the public `/api/courses` route. Every query here
 * is hard-scoped to `status: 'published'` — drafts are never reachable from
 * the public site, only from `app/api/admin/courses/*`. Mirrors the
 * lib/publicRecipes.js pattern exactly. Filtering/sorting/pagination are
 * server-side.
 *
 * Deliberately does NOT apply per-lesson access-control redaction — these
 * are plain DB-fetching helpers with no request/actor context, same as
 * every other lib/public*.js module. Callers (app/api/courses/[slug]/route.js,
 * app/courses/[slug]/page.js) apply lib/courseAccess.js's
 * annotateLessonAccess() afterward, once they have the current actor.
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

/** Published courses with optional category (slug)/difficulty/tag/text-search filters, sort, and pagination. */
export async function getPublishedCourses({
  category = '',
  difficulty = '',
  tag = '',
  search = '',
  sort = '',
  page = 1,
  limit = 12,
} = {}) {
  await connectDB();

  const query = { status: 'published' };

  if (category) {
    const categoryDoc = await CourseCategory.findOne({ slug: category }).select('_id').lean();
    query.category = categoryDoc ? categoryDoc._id : null; // no match -> empty results, not "ignore filter"
  }
  if (difficulty) query.difficulty = difficulty;
  if (tag) query.tags = tag.trim().toLowerCase();
  if (search?.trim()) query.$text = { $search: search.trim() };

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(48, Math.max(1, Number(limit) || 12));
  const sortSpec = SORT_OPTIONS[sort] || DEFAULT_SORT;

  const [courses, total] = await Promise.all([
    Course.find(query)
      .populate('category', 'name slug')
      .sort(sortSpec)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Course.countDocuments(query),
  ]);

  return {
    courses: serialize(courses),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

/** Up to `limit` featured, published courses — powers the Courses listing page and the Knowledge Center section. */
export async function getFeaturedCourses(limit = 6) {
  await connectDB();

  const courses = await Course.find({ status: 'published', featured: true })
    .populate('category', 'name slug')
    .sort({ displayOrder: 1, publishedAt: -1 })
    .limit(limit)
    .lean();

  return serialize(courses);
}

/** Active course categories, admin-ordered — same "curated nav, not derived facet" convention as Recipe Categories. */
export async function getActiveCourseCategories() {
  await connectDB();

  const categories = await CourseCategory.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  return serialize(categories);
}

/** Distinct tags among published courses — powers the search-by-tag filter. */
export async function getCourseTagsFacet() {
  await connectDB();

  const tags = await Course.distinct('tags', { status: 'published' });

  return tags.filter(Boolean).sort((a, b) => a.localeCompare(b));
}

/**
 * A single published course by slug, with its full curriculum (sections +
 * lessons) attached. Lessons are NOT access-redacted here — see this
 * module's header comment.
 */
export async function getCourseBySlug(slug) {
  await connectDB();

  const course = await Course.findOne({ slug, status: 'published' })
    .populate('category', 'name slug')
    .lean();
  if (!course) return null;

  const sections = await Section.find({ course: course._id }).sort({ displayOrder: 1 }).lean();
  const lessons = await Lesson.find({ course: course._id }).sort({ displayOrder: 1 }).lean();

  const lessonsBySection = new Map();
  for (const lesson of lessons) {
    const key = String(lesson.section);
    if (!lessonsBySection.has(key)) lessonsBySection.set(key, []);
    lessonsBySection.get(key).push(lesson);
  }

  course.sections = sections.map((section) => ({
    ...section,
    lessons: lessonsBySection.get(String(section._id)) || [],
  }));

  // Sprint 19.5 — derived, not stored: total estimated minutes across every
  // lesson, the structured counterpart to Course.duration's free-text field
  // (see models/Course.js's own comment on this). Computed here since every
  // caller of getCourseBySlug() already has the full lesson list loaded —
  // no extra query, and never drifts from the lessons' own durations.
  course.totalEstimatedDuration = lessons.reduce((sum, l) => sum + (l.estimatedDuration || 0), 0);

  return serialize(course);
}

/**
 * A single lesson by id, scoped to its published parent course — used by
 * the lesson viewer page/route. Returns null (not the lesson) if the
 * course isn't published, so an unpublished course's lessons are never
 * reachable from the public site regardless of the lesson's own accessLevel.
 */
export async function getPublicLessonById(lessonId) {
  if (!mongoose.Types.ObjectId.isValid(lessonId)) return null;

  await connectDB();

  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) return null;

  const course = await Course.findOne({ _id: lesson.course, status: 'published' })
    .select('title slug status')
    .lean();
  if (!course) return null;

  return { lesson: serialize(lesson), course: serialize(course) };
}

/** Up to `limit` other published courses in the same category. */
export async function getRelatedCourses(course, limit = 3) {
  await connectDB();

  const categoryId = course?.category?._id || course?.category;
  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) return [];

  const related = await Course.find({
    status: 'published',
    category: categoryId,
    slug: { $ne: course.slug },
  })
    .populate('category', 'name slug')
    .sort({ displayOrder: 1, publishedAt: -1 })
    .limit(limit)
    .lean();

  return serialize(related);
}
