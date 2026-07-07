import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { PRODUCT_CATEGORY_VALUES } from '@/lib/productCategories';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/products
 * Query params: status ('draft'|'published'), category, search (text).
 * No pagination — the product catalog stays small. Mirrors
 * app/api/admin/team/route.js.
 */
export const GET = withErrorHandling(async (request) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const search = searchParams.get('search')?.trim();

  const query = {};
  if (status && ['draft', 'published'].includes(status)) query.status = status;
  if (category && PRODUCT_CATEGORY_VALUES.includes(category)) query.category = category;
  if (search) query.$text = { $search: search };

  const products = await Product.find(query)
    .populate('author', 'name')
    .sort({ category: 1, displayOrder: 1, name: 1 })
    .lean();

  return ok({ products });
});

/**
 * POST /api/admin/products
 * Creates a new product. `status` may be 'draft' (default) or 'published'.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  await connectDB();

  const body = await request.json();

  if (!body?.name?.trim()) return fail('Name is required', 400);
  if (!PRODUCT_CATEGORY_VALUES.includes(body?.category)) return fail('A valid category is required', 400);

  const originalPrice = Number(body.originalPrice) || 0;
  const sellingPrice = Number(body.sellingPrice) || 0;
  if (originalPrice < 0 || sellingPrice < 0) return fail('Prices cannot be negative', 400);
  if (originalPrice > 0 && sellingPrice > originalPrice) {
    return fail('Selling price cannot exceed original price', 400);
  }

  const product = await Product.create({
    name: body.name,
    description: body.description || '',
    category: body.category,
    image: {
      url: body.image?.url || '',
      alt: body.image?.alt || '',
    },
    originalPrice,
    sellingPrice,
    stockStatus: body.stockStatus === 'out-of-stock' ? 'out-of-stock' : 'in-stock',
    featured: Boolean(body.featured),
    displayOrder: Number.isFinite(body.displayOrder) ? body.displayOrder : 0,
    status: body.status === 'published' ? 'published' : 'draft',
    author: user._id,
  });

  return ok({ product }, 201);
});
