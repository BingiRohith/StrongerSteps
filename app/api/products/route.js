import { ok, withErrorHandling } from '@/lib/apiResponse';
import { getPublishedProducts } from '@/lib/publicProducts';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products — public, unauthenticated, published-only. Query params:
 * category, search. No pagination — the product catalog stays small.
 * Deliberately separate from app/api/admin/products/route.js, which stays
 * untouched and keeps requiring auth + returning drafts.
 */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';

  const products = await getPublishedProducts({ category, search });

  return ok({ products });
});
