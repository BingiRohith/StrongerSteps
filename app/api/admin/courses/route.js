import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import CourseCategory from '@/models/CourseCategory'; // eslint-disable-line no-unused-vars -- registers the ref before populate
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { DIFFICULTY_VALUES } from '@/lib/courseOptions';
import { isValidAccessLevel } from '@/lib/access/accessLevels';

export const dynamic = 'force-dynamic';

/** Sanitizes a client-submitted instructors array into the schema's exact sub-doc shape. */
function sanitizeInstructors(instructors) {
  if (!Array.isArray(instructors)) return [];
  return instructors.map((i) => ({
    name: i?.name || '',
    title: i?.title || '',
    bio: i?.bio || '',
    photo: { url: i?.photo?.url || '', alt: i?.photo?.alt || '' },
  }));
}

/**
 * GET /api/admin/courses
 * Query params: status ('draft'|'published'), category (id), difficulty,
 * search (text). No pagination — mirrors app/api/admin/recipes/route.js.
 */
export const GET = withErrorHandling(async (request) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');
  const search = searchParams.get('search')?.trim();

  const query = {};
  if (status && ['draft', 'published'].includes(status)) query.status = status;
  if (category && mongoose.Types.ObjectId.isValid(category)) query.category = category;
  if (difficulty && DIFFICULTY_VALUES.includes(difficulty)) query.difficulty = difficulty;
  if (search) query.$text = { $search: search };

  const courses = await Course.find(query)
    .populate('createdBy', 'name')
    .populate('category', 'name slug')
    .sort({ displayOrder: 1, title: 1 })
    .lean();

  return ok({ courses });
});

/**
 * POST /api/admin/courses
 * Body: title, category (valid CourseCategory id) required. `status` may be
 * 'draft' (default) or 'published'.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  await connectDB();

  const body = await request.json();

  if (!body?.title?.trim()) return fail('Course title is required', 400);
  if (!body?.category || !mongoose.Types.ObjectId.isValid(body.category)) {
    return fail('A valid category is required', 400);
  }
  const categoryExists = await CourseCategory.exists({ _id: body.category });
  if (!categoryExists) return fail('Category not found', 400);

  const accessLevel = isValidAccessLevel(body.accessLevel) ? body.accessLevel : 'PUBLIC';

  const course = await Course.create({
    title: body.title,
    slug: body.slug || undefined,
    description: body.description || '',
    longDescription: body.longDescription || '',
    thumbnail: { url: body.thumbnail?.url || '', alt: body.thumbnail?.alt || '' },
    banner: { url: body.banner?.url || '', alt: body.banner?.alt || '' },
    instructors: sanitizeInstructors(body.instructors),
    duration: body.duration || '',
    difficulty: DIFFICULTY_VALUES.includes(body.difficulty) ? body.difficulty : 'Beginner',
    language: body.language || 'English',
    category: body.category,
    tags: Array.isArray(body.tags) ? body.tags : [],
    prerequisites: Array.isArray(body.prerequisites) ? body.prerequisites : [],
    learningOutcomes: Array.isArray(body.learningOutcomes) ? body.learningOutcomes : [],
    whatYoullLearn: Array.isArray(body.whatYoullLearn) ? body.whatYoullLearn : [],
    certificateAvailable: Boolean(body.certificateAvailable),
    featured: Boolean(body.featured),
    displayOrder: Number.isFinite(body.displayOrder) ? body.displayOrder : 0,
    accessLevel,
    status: body.status === 'published' ? 'published' : 'draft',
    seo: {
      title: body.seo?.title || '',
      metaDescription: body.seo?.metaDescription || '',
    },
    createdBy: user._id,
    updatedBy: user._id,
  });

  return ok({ course }, 201);
});
