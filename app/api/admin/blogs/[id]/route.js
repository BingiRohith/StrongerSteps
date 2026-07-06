import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Blog from '@/models/Blog';
import Category from '@/models/Category'; // eslint-disable-line no-unused-vars -- registers the ref before populate
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid blog id', 400);

  await connectDB();
  const blog = await Blog.findById(params.id).populate('category', 'name slug').populate('author', 'name');
  if (!blog) return fail('Blog not found', 404);

  return ok({ blog });
});

/**
 * PUT /api/admin/blogs/:id — full update. Any subset of blog fields may be
 * sent; only the fields present in the body are applied.
 */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid blog id', 400);

  await connectDB();
  const blog = await Blog.findById(params.id);
  if (!blog) return fail('Blog not found', 404);

  const body = await request.json();

  if (body.title !== undefined) {
    if (!body.title.trim()) return fail('Title is required', 400);
    blog.title = body.title;
  }
  if (body.slug !== undefined) blog.slug = body.slug;
  if (body.excerpt !== undefined) blog.excerpt = body.excerpt;
  if (body.content !== undefined) {
    if (!body.content.trim()) return fail('Content is required', 400);
    blog.content = body.content;
  }
  if (body.coverImage !== undefined) {
    blog.coverImage = {
      url: body.coverImage?.url || '',
      alt: body.coverImage?.alt || '',
    };
  }
  if (body.category !== undefined) {
    if (!body.category) return fail('Category is required', 400);
    blog.category = body.category;
  }
  if (body.tags !== undefined) blog.tags = body.tags;
  if (body.seo !== undefined) {
    blog.seo = {
      title: body.seo?.title || '',
      metaDescription: body.seo?.metaDescription || '',
    };
  }
  if (body.status !== undefined) {
    if (!['draft', 'published'].includes(body.status)) return fail('Invalid status', 400);
    blog.status = body.status;
  }

  await blog.save();
  await blog.populate('category', 'name slug');

  return ok({ blog });
});

export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid blog id', 400);

  await connectDB();
  const blog = await Blog.findByIdAndDelete(params.id);
  if (!blog) return fail('Blog not found', 404);

  return ok({ deleted: true });
});
