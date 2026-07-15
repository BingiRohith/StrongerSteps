import connectDB from '@/lib/db';
import { getOrCreateHomepage } from '@/models/Homepage';
import { ok, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/homepage — public, no auth. Returns the singleton Homepage doc
 * (seeded with defaults on first call). Used by app/page.js.
 */
export const GET = withErrorHandling(async () => {
  await connectDB();
  const homepage = await getOrCreateHomepage();
  return ok({ homepage: homepage.toSafeObject() });
});
