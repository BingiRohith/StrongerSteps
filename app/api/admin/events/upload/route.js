import { requireAuth } from '@/lib/auth';
import { ok } from '@/lib/apiResponse';
import { saveUploadedImage } from '@/lib/localUpload';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/events/upload — image upload for both the event's
 * featured image and its host's photo (same subdir, either field just
 * takes the returned url). Mirrors app/api/admin/products/upload/route.js.
 */
export async function POST(request) {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  const result = await saveUploadedImage(request, 'events');
  if (result.error) return result.error;

  return ok({ url: result.url });
}
