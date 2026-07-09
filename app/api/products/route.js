import { ok, withErrorHandling } from '@/lib/apiResponse';
import { getPublishedProducts } from '@/lib/publicProducts';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products — public, unauthenticated, published-only. Query params:
 * category, brand, search, minPrice, maxPrice, availability
 * (in-stock|out-of-stock), sort (price-asc|price-desc|featured|name-asc|newest),
 * page (default 1), limit (default 12, max 48). Filtering/sorting/pagination
 * are all applied server-side (Sprint 12.5) — used by both the Products page
 * and the header product search (Module 2), so the two never diverge.
 * Deliberately separate from app/api/admin/products/route.js, which stays
 * untouched and keeps requiring auth + returning drafts.
 */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);

  const { products, pagination } = await getPublishedProducts({
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    search: searchParams.get('search') || '',
    minPrice: searchParams.get('minPrice') || undefined,
    maxPrice: searchParams.get('maxPrice') || undefined,
    availability: searchParams.get('availability') || '',
    sort: searchParams.get('sort') || '',
    page: searchParams.get('page') || 1,
    limit: searchParams.get('limit') || 12,
  });

  return ok({ products, pagination });
});
