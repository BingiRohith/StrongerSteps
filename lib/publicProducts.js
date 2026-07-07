import connectDB from '@/lib/db';
import Product from '@/models/Product';

/**
 * Read-only query helpers for the *public* /products page and the public
 * `/api/products` route. Every query here is hard-scoped to
 * `status: 'published'` — drafts are never reachable from the public site,
 * only from the existing admin routes in `app/api/admin/products/*`.
 * Mirrors `lib/publicTeam.js`, minus pagination — the product catalog stays
 * small enough to load in full.
 */

function serialize(doc) {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

// Products created before pricing/stock fields existed on the schema don't
// have these keys in their stored document at all — `.lean()` reads never
// apply Mongoose schema defaults — so this guarantees the public API always
// returns numeric/enum values instead of `undefined`.
function withDefaults(product) {
  return {
    ...product,
    originalPrice: product.originalPrice ?? 0,
    sellingPrice: product.sellingPrice ?? 0,
    discountPercentage: product.discountPercentage ?? 0,
    stockStatus: product.stockStatus ?? 'in-stock',
    featured: product.featured ?? false,
  };
}

/**
 * Published products, grouped implicitly by category via sort order
 * (category, then displayOrder, then name), with an optional category or
 * text search filter.
 */
export async function getPublishedProducts({ category = '', search = '' } = {}) {
  await connectDB();

  const query = { status: 'published' };
  if (category) query.category = category;
  if (search?.trim()) query.$text = { $search: search.trim() };

  const products = await Product.find(query)
    .sort({ category: 1, displayOrder: 1, name: 1 })
    .lean();

  return serialize(products).map(withDefaults);
}
