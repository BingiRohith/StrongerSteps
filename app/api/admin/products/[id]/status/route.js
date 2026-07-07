import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/products/:id/status — one-click publish/unpublish toggle,
 * mirrors app/api/admin/team/[id]/status/route.js.
 * Body: { status: 'draft' | 'published' }
 */
export const PATCH = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!mongoose.Types.ObjectId.isValid(params.id)) return fail('Invalid product id', 400);

  const body = await request.json();
  if (!['draft', 'published'].includes(body?.status)) {
    return fail("Status must be 'draft' or 'published'", 400);
  }

  await connectDB();
  const product = await Product.findById(params.id);
  if (!product) return fail('Product not found', 404);

  product.status = body.status;
  await product.save();

  return ok({ product });
});
