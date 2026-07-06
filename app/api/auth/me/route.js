import { getCurrentUser } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handler(request) {
  const user = await getCurrentUser(request);

  if (!user) {
    return fail('Not authenticated', 401);
  }

  return ok({ user: user.toSafeObject() });
}

export const GET = withErrorHandling(handler);
