import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Infographic from '@/models/Infographic';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid infographic id', 400);

  await connectDB();
  const infographic = await Infographic.findById(params.id).populate('author', 'name');
  if (!infographic) return fail('Infographic not found', 404);

  return ok({ infographic });
});

/**
 * PUT /api/admin/infographics/:id — full update. Any subset of infographic
 * fields may be sent; only the fields present in the body are applied.
 */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid infographic id', 400);

  await connectDB();
  const infographic = await Infographic.findById(params.id);
  if (!infographic) return fail('Infographic not found', 404);

  const body = await request.json();

  if (body.title !== undefined) {
    if (!body.title.trim()) return fail('Title is required', 400);
    infographic.title = body.title;
  }
  if (body.slug !== undefined) infographic.slug = body.slug;
  if (body.description !== undefined) infographic.description = body.description;
  if (body.category !== undefined) {
    if (!body.category.trim()) return fail('Category is required', 400);
    infographic.category = body.category;
  }
  if (body.thumbnailImage !== undefined) {
    infographic.thumbnailImage = {
      url: body.thumbnailImage?.url || '',
      alt: body.thumbnailImage?.alt || '',
    };
  }
  if (body.fullImage !== undefined) {
    infographic.fullImage = {
      url: body.fullImage?.url || '',
      alt: body.fullImage?.alt || '',
    };
  }
  if (body.pdf !== undefined) {
    infographic.pdf = {
      url: body.pdf?.url || '',
      filename: body.pdf?.filename || '',
    };
  }
  if (body.seo !== undefined) {
    infographic.seo = {
      title: body.seo?.title || '',
      metaDescription: body.seo?.metaDescription || '',
    };
  }
  if (body.status !== undefined) {
    if (!['draft', 'published'].includes(body.status)) return fail('Invalid status', 400);
    infographic.status = body.status;
  }

  await infographic.save();

  return ok({ infographic });
});

export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid infographic id', 400);

  await connectDB();
  const infographic = await Infographic.findByIdAndDelete(params.id);
  if (!infographic) return fail('Infographic not found', 404);

  return ok({ deleted: true });
});
