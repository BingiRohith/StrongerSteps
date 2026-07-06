import connectDB from '@/lib/db';
import Blog from '@/models/Blog';
import Category from '@/models/Category'; // eslint-disable-line no-unused-vars -- registers the ref before populate
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/blogs
 * Query params: status ('draft'|'published'), category (id), search (text),
 * page (default 1), limit (default 20).
 */
export const GET = withErrorHandling(async (request) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const search = searchParams.get('search')?.trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

  const query = {};
  if (status && ['draft', 'published'].includes(status)) query.status = status;
  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const [blogs, total] = await Promise.all([
    Blog.find(query)
      .populate('category', 'name slug')
      .populate('author', 'name')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Blog.countDocuments(query),
  ]);

  return ok({
    blogs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

/**
 * POST /api/admin/blogs
 * Creates a new blog. `status` may be 'draft' (default) or 'published'.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  await connectDB();

  const body = await request.json();

  if (!body?.title?.trim()) return fail('Title is required', 400);
  if (!body?.content?.trim()) return fail('Content is required', 400);
  if (!body?.category) return fail('Category is required', 400);

  const blog = await Blog.create({
    title: body.title,
    slug: body.slug || undefined,
    excerpt: body.excerpt || '',
    content: body.content,
    coverImage: {
      url: body.coverImage?.url || '',
      alt: body.coverImage?.alt || '',
    },
    category: body.category,
    tags: body.tags || [],
    seo: {
      title: body.seo?.title || '',
      metaDescription: body.seo?.metaDescription || '',
    },
    status: body.status === 'published' ? 'published' : 'draft',
    author: user._id,
  });

  await blog.populate('category', 'name slug');

  return ok({ blog }, 201);
});
