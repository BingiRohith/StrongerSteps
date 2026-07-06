import connectDB from '@/lib/db';
import User from '@/models/User';
import { signToken, setAuthCookie } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const runtime = 'nodejs';

async function handler(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return fail('Email and password are required', 400);
  }

  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user || !user.isActive) {
    return fail('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return fail('Invalid email or password', 401);
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken(user);

  const response = ok({ user: user.toSafeObject() });
  return setAuthCookie(response, token);
}

export const POST = withErrorHandling(handler);
