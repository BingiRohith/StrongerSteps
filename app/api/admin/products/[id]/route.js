import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import ProductCategory from '@/models/ProductCategory';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid product id', 400);

  await connectDB();
  const product = await Product.findById(params.id).populate('author', 'name').populate('category', 'name slug');
  if (!product) return fail('Product not found', 404);

  return ok({ product });
});

/**
 * PUT /api/admin/products/:id — full update. Any subset of product fields
 * may be sent; only the fields present in the body are applied.
 */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid product id', 400);

  await connectDB();
  const product = await Product.findById(params.id);
  if (!product) return fail('Product not found', 404);

  const body = await request.json();

  if (body.name !== undefined) {
    if (!body.name.trim()) return fail('Name is required', 400);
    product.name = body.name;
  }
  if (body.description !== undefined) product.description = body.description;
  if (body.brand !== undefined) product.brand = body.brand;
  if (body.category !== undefined) {
    if (!isValidId(body.category) || !(await ProductCategory.exists({ _id: body.category }))) {
      return fail('A valid category is required', 400);
    }
    product.category = body.category;
  }
  if (body.image !== undefined) {
    product.image = {
      url: body.image?.url || '',
      alt: body.image?.alt || '',
    };
  }
  if (body.originalPrice !== undefined || body.sellingPrice !== undefined) {
    const originalPrice = Number(
      body.originalPrice !== undefined ? body.originalPrice : product.originalPrice
    ) || 0;
    const sellingPrice = Number(
      body.sellingPrice !== undefined ? body.sellingPrice : product.sellingPrice
    ) || 0;
    if (originalPrice < 0 || sellingPrice < 0) return fail('Prices cannot be negative', 400);
    if (originalPrice > 0 && sellingPrice > originalPrice) {
      return fail('Selling price cannot exceed original price', 400);
    }
    product.originalPrice = originalPrice;
    product.sellingPrice = sellingPrice;
  }
  if (body.stockStatus !== undefined) {
    if (!['in-stock', 'out-of-stock'].includes(body.stockStatus)) return fail('Invalid stock status', 400);
    product.stockStatus = body.stockStatus;
  }
  if (body.featured !== undefined) product.featured = Boolean(body.featured);
  if (body.displayOrder !== undefined) {
    product.displayOrder = Number.isFinite(body.displayOrder) ? body.displayOrder : 0;
  }
  if (body.status !== undefined) {
    if (!['draft', 'published'].includes(body.status)) return fail('Invalid status', 400);
    product.status = body.status;
  }

  await product.save();

  return ok({ product });
});

export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid product id', 400);

  await connectDB();
  const product = await Product.findByIdAndDelete(params.id);
  if (!product) return fail('Product not found', 404);

  return ok({ deleted: true });
});
