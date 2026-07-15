import connectDB from '@/lib/db';
import User from '@/models/User';
import { signToken, setAuthCookie } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { isRateLimited } from '@/lib/rateLimit';

export const runtime = 'nodejs';

const LOGIN_RATE_LIMIT = { max: 8, windowMs: 15 * 60 * 1000 };

async function handler(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return fail('Email and password are required', 400);
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateLimitKey = `${email.toLowerCase().trim()}:${ip}`;
  if (isRateLimited(rateLimitKey, LOGIN_RATE_LIMIT)) {
    return fail('Too many login attempts. Please try again in a few minutes.', 429);
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
