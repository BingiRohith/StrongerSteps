import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Blog from '@/models/Blog';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/blogs/:id/status — dedicated one-click publish/unpublish
 * toggle, so the list page doesn't need to resend the whole blog just to
 * flip its status.
 * Body: { status: 'draft' | 'published' }
 */
export const PATCH = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid blog id', 400);

  const body = await request.json();
  if (!['draft', 'published'].includes(body?.status)) {
    return fail("Status must be 'draft' or 'published'", 400);
  }

  await connectDB();
  const blog = await Blog.findById(params.id);
  if (!blog) return fail('Blog not found', 404);

  blog.status = body.status;
  await blog.save();
  await blog.populate('category', 'name slug');

  return ok({ blog });
});
