import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AdminShell from '@/components/admin/AdminShell';

// Reads cookies on every request — same reasoning as app/api/auth/me/route.js.
export const dynamic = 'force-dynamic';

/**
 * Server-side gate for every /admin/* page except /admin/login.
 * middleware.js already redirects signed-out visitors at the edge (fast
 * path, cookie-presence only); this is the real authorization check,
 * mirroring lib/auth.js's requireAuth() used by the API routes.
 */
export default async function ProtectedAdminLayout({ children }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/admin/login');
  }

  return <AdminShell user={user.toSafeObject()}>{children}</AdminShell>;
}
