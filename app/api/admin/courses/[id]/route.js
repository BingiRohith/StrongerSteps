import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import CourseCategory from '@/models/CourseCategory';
import Section from '@/models/Section';
import Lesson from '@/models/Lesson';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { DIFFICULTY_VALUES } from '@/lib/courseOptions';
import { isValidAccessLevel } from '@/lib/access/accessLevels';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

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

export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid course id', 400);

  await connectDB();
  const course = await Course.findById(params.id)
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name')
    .populate('category', 'name slug');
  if (!course) return fail('Course not found', 404);

  return ok({ course });
});

/**
 * PUT /api/admin/courses/:id — partial update. Any subset of course fields
 * may be sent; only the fields present in the body are applied. Also used
 * by the admin list's reorder controls to swap `displayOrder` between two
 * adjacent courses.
 */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid course id', 400);

  await connectDB();
  const course = await Course.findById(params.id);
  if (!course) return fail('Course not found', 404);

  const body = await request.json();

  if (body.title !== undefined) {
    if (!body.title.trim()) return fail('Course title is required', 400);
    course.title = body.title;
  }
  if (body.slug !== undefined) course.slug = body.slug;
  if (body.description !== undefined) course.description = body.description;
  if (body.longDescription !== undefined) course.longDescription = body.longDescription;
  if (body.thumbnail !== undefined) {
    course.thumbnail = { url: body.thumbnail?.url || '', alt: body.thumbnail?.alt || '' };
  }
  if (body.banner !== undefined) {
    course.banner = { url: body.banner?.url || '', alt: body.banner?.alt || '' };
  }
  if (body.instructors !== undefined) {
    course.instructors = sanitizeInstructors(body.instructors);
  }
  if (body.duration !== undefined) course.duration = body.duration;
  if (body.difficulty !== undefined) {
    if (!DIFFICULTY_VALUES.includes(body.difficulty)) return fail('Invalid difficulty', 400);
    course.difficulty = body.difficulty;
  }
  if (body.language !== undefined) course.language = body.language || 'English';
  if (body.category !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(body.category)) return fail('A valid category is required', 400);
    const categoryExists = await CourseCategory.exists({ _id: body.category });
    if (!categoryExists) return fail('Category not found', 400);
    course.category = body.category;
  }
  if (body.tags !== undefined) course.tags = Array.isArray(body.tags) ? body.tags : [];
  if (body.prerequisites !== undefined) {
    course.prerequisites = Array.isArray(body.prerequisites) ? body.prerequisites : [];
  }
  if (body.learningOutcomes !== undefined) {
    course.learningOutcomes = Array.isArray(body.learningOutcomes) ? body.learningOutcomes : [];
  }
  if (body.whatYoullLearn !== undefined) {
    course.whatYoullLearn = Array.isArray(body.whatYoullLearn) ? body.whatYoullLearn : [];
  }
  if (body.certificateAvailable !== undefined) course.certificateAvailable = Boolean(body.certificateAvailable);
  if (body.featured !== undefined) course.featured = Boolean(body.featured);
  if (body.displayOrder !== undefined) {
    course.displayOrder = Number.isFinite(body.displayOrder) ? body.displayOrder : 0;
  }
  if (body.accessLevel !== undefined) {
    if (!isValidAccessLevel(body.accessLevel)) return fail('Invalid access level', 400);
    course.accessLevel = body.accessLevel;
  }
  if (body.status !== undefined) {
    if (!['draft', 'published'].includes(body.status)) return fail('Invalid status', 400);
    course.status = body.status;
  }
  if (body.seo !== undefined) {
    course.seo = {
      title: body.seo?.title || '',
      metaDescription: body.seo?.metaDescription || '',
    };
  }

  course.updatedBy = user._id;
  await course.save();

  return ok({ course });
});

/**
 * DELETE /api/admin/courses/:id — cascade-deletes its Sections and Lessons.
 * A deliberate deviation from this project's usual "no cascade delete"
 * precedent (Event->Booking, RecipeCategory->Recipe, Team->Team all leave
 * orphans in place): unlike those cases, an orphaned Section/Lesson has no
 * admin list of its own to ever reach again — it isn't a visible dangling
 * reference, it's permanently unreachable dead data. See docs/13_DECISIONS.md.
 */
export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid course id', 400);

  await connectDB();
  const course = await Course.findByIdAndDelete(params.id);
  if (!course) return fail('Course not found', 404);

  await Promise.all([
    Lesson.deleteMany({ course: params.id }),
    Section.deleteMany({ course: params.id }),
  ]);

  return ok({ deleted: true });
});
