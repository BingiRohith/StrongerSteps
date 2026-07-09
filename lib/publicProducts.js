import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { PRODUCT_CATEGORIES } from '@/lib/productCategories';

/**
 * Read-only query helpers for the *public* /products page and the public
 * `/api/products` route. Every query here is hard-scoped to
 * `status: 'published'` — drafts are never reachable from the public site,
 * only from the existing admin routes in `app/api/admin/products/*`.
 *
 * Sprint 12.5: filtering/sorting/pagination moved server-side (was: fetch
 * the whole small catalog, filter in the browser) to support the
 * marketplace redesign without ever loading the full catalog into the
 * client — mirrors the `{ items, pagination }` shape already used by
 * `lib/publicBlogs.js`/`lib/publicInfographics.js`.
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
    brand: product.brand ?? '',
    originalPrice: product.originalPrice ?? 0,
    sellingPrice: product.sellingPrice ?? 0,
    discountPercentage: product.discountPercentage ?? 0,
    stockStatus: product.stockStatus ?? 'in-stock',
    featured: product.featured ?? false,
  };
}

const SORT_OPTIONS = {
  'price-asc': { sellingPrice: 1 },
  'price-desc': { sellingPrice: -1 },
  featured: { featured: -1, displayOrder: 1 },
  'name-asc': { name: 1 },
  newest: { createdAt: -1 },
};
const DEFAULT_SORT = { category: 1, displayOrder: 1, name: 1 };

/**
 * Published products with optional category/brand/text-search/price-range/
 * availability filters, a sort option, and page-based pagination — all
 * applied server-side so the client never has to load the full catalog.
 */
export async function getPublishedProducts({
  category = '',
  brand = '',
  search = '',
  minPrice,
  maxPrice,
  availability = '',
  sort = '',
  page = 1,
  limit = 12,
} = {}) {
  await connectDB();

  const query = { status: 'published' };
  if (category) query.category = category;
  if (brand) query.brand = brand;
  if (availability === 'in-stock' || availability === 'out-of-stock') {
    query.stockStatus = availability;
  }
  if (search?.trim()) query.$text = { $search: search.trim() };

  // `minPrice`/`maxPrice` arrive as strings (query params) — '' must NOT be
  // treated as 0 (Number('') is 0, which is finite), or every request
  // without an explicit price filter would wrongly narrow to sellingPrice=0.
  const hasMin = minPrice !== undefined && minPrice !== null && minPrice !== '';
  const hasMax = maxPrice !== undefined && maxPrice !== null && maxPrice !== '';
  const min = Number(minPrice);
  const max = Number(maxPrice);
  if ((hasMin && Number.isFinite(min)) || (hasMax && Number.isFinite(max))) {
    query.sellingPrice = {};
    if (hasMin && Number.isFinite(min)) query.sellingPrice.$gte = min;
    if (hasMax && Number.isFinite(max)) query.sellingPrice.$lte = max;
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(48, Math.max(1, Number(limit) || 12));
  const sortSpec = SORT_OPTIONS[sort] || DEFAULT_SORT;

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sortSpec)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Product.countDocuments(query),
  ]);

  return {
    products: serialize(products).map(withDefaults),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

/**
 * Sidebar filter facets across the *whole* published catalog (not just the
 * current page) — fetched once, not refetched on every filter/page change.
 * Categories/brands are real distinct values, never hardcoded; category
 * itself stays a closed enum (see lib/productCategories.js and
 * docs/13_DECISIONS.md) — only categories with at least one published
 * product are surfaced, same pattern as getInfographicCategories().
 */
export async function getProductFilterFacets() {
  await connectDB();

  const [presentCategories, brands, priceBounds] = await Promise.all([
    Product.distinct('category', { status: 'published' }),
    Product.distinct('brand', { status: 'published', brand: { $nin: ['', null] } }),
    Product.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: null, min: { $min: '$sellingPrice' }, max: { $max: '$sellingPrice' } } },
    ]),
  ]);

  const categories = PRODUCT_CATEGORIES.filter((c) => presentCategories.includes(c.value));
  const bounds = priceBounds[0] || { min: 0, max: 0 };

  return {
    categories,
    brands: brands.sort((a, b) => a.localeCompare(b)),
    priceRange: { min: bounds.min ?? 0, max: bounds.max ?? 0 },
  };
}
