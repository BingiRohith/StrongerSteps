import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Usability entry point only — `/admin` itself has never had a page, so it
 * 404'd (see docs/13_DECISIONS.md). Reuses the same `getCurrentUser()`
 * session check as app/admin/(protected)/layout.js rather than duplicating
 * auth logic; middleware, the login page, and the protected layout are
 * untouched.
 */
export default async function AdminIndexPage() {
  const user = await getCurrentUser();
  redirect(user ? '/admin/dashboard' : '/admin/login');
}
