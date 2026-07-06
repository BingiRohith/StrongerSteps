import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Creating new users (admins/editors) is an admin-only action, not public
 * signup. The very first admin account is created via the seed script
 * (scripts/createAdmin.mjs) rather than through this route.
 */
async function handler(request) {
  const authResult = await requireAuth(request, ['admin']);
  if (authResult instanceof Response) return authResult;

  const { name, email, password, role } = await request.json();

  if (!name || !email || !password) {
    return fail('Name, email and password are required', 400);
  }

  if (password.length < 8) {
    return fail('Password must be at least 8 characters', 400);
  }

  if (role && !['admin', 'editor'].includes(role)) {
    return fail('Invalid role', 400);
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return fail('A user with this email already exists', 409);
  }

  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    password,
    role: role || 'editor',
  });

  return ok({ user: user.toSafeObject() }, 201);
}

export const POST = withErrorHandling(handler);
