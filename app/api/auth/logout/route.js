import { clearAuthCookie } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';

export const runtime = 'nodejs';

async function handler() {
  const response = ok({ message: 'Logged out' });
  return clearAuthCookie(response);
}

export const POST = withErrorHandling(handler);
