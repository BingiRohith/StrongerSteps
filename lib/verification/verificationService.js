import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Verification from '@/models/Verification';
import { getResourceConfig } from './resourceRegistry';
import { generateOtp, hashOtp, compareOtp } from './otp';
import { getEmailProvider, getSmsProvider } from './providers';

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 10;
const MAX_VERIFY_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_REQUESTS = 3;
const DOWNLOAD_TOKEN_EXPIRY_MINUTES = Number(process.env.DOWNLOAD_TOKEN_EXPIRY_MINUTES) || 15;
const DOWNLOAD_TOKEN_PURPOSE = 'download';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET environment variable.');
  }
  return secret;
}

/**
 * Request an OTP for a given resource. `resourceType` is checked against
 * lib/verification/resourceRegistry.js (not a DB enum), and the resource
 * itself must exist and currently be accessible (e.g. published).
 * Returns { ok, error?, status?, verificationId? } — never the OTP itself.
 */
export async function createVerificationRequest({ resourceType, resourceId, method, email, mobile }) {
  const config = getResourceConfig(resourceType);
  if (!config) {
    return { ok: false, error: 'Unsupported resource type', status: 400 };
  }
  if (!mongoose.Types.ObjectId.isValid(resourceId)) {
    return { ok: false, error: 'Invalid resource id', status: 400 };
  }
  if (!['email', 'mobile'].includes(method)) {
    return { ok: false, error: 'Verification method must be email or mobile', status: 400 };
  }

  const identifierField = method === 'email' ? 'email' : 'mobile';
  const identifierValue = method === 'email' ? email?.trim().toLowerCase() : mobile?.trim();
  if (!identifierValue) {
    return { ok: false, error: `A valid ${method} is required`, status: 400 };
  }

  await connectDB();

  const resource = await config.model.findById(resourceId);
  if (!resource || !config.isAccessible(resource)) {
    return { ok: false, error: 'Resource not found', status: 404 };
  }

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
  const recentCount = await Verification.countDocuments({
    [identifierField]: identifierValue,
    createdAt: { $gte: windowStart },
  });
  if (recentCount >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      ok: false,
      error: `Too many verification requests. Please try again in a few minutes.`,
      status: 429,
    };
  }

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const verification = await Verification.create({
    resourceType,
    resourceId,
    method,
    email: method === 'email' ? identifierValue : null,
    mobile: method === 'mobile' ? identifierValue : null,
    otpHash,
    expiresAt,
  });

  const provider = method === 'email' ? getEmailProvider() : getSmsProvider();
  await provider.send({ to: identifierValue, otp, channel: method });

  return { ok: true, verificationId: verification._id.toString() };
}

/**
 * Verify a submitted OTP. On success, issues a short-lived signed download
 * token (not a permanent URL) scoped to this one resource/verification.
 */
export async function verifyOtp({ verificationId, otp }) {
  if (!mongoose.Types.ObjectId.isValid(verificationId)) {
    return { ok: false, error: 'Invalid verification id', status: 400 };
  }

  await connectDB();

  const verification = await Verification.findById(verificationId);
  if (!verification) {
    return { ok: false, error: 'Verification request not found', status: 404 };
  }
  if (verification.verified) {
    return { ok: false, error: 'This code has already been used', status: 400 };
  }
  if (verification.expiresAt < new Date()) {
    return { ok: false, error: 'This code has expired. Please request a new one.', status: 400 };
  }
  if (verification.attemptCount >= MAX_VERIFY_ATTEMPTS) {
    return { ok: false, error: 'Too many incorrect attempts. Please request a new code.', status: 429 };
  }

  verification.attemptCount += 1;

  const matches = await compareOtp(String(otp || ''), verification.otpHash);
  if (!matches) {
    await verification.save();
    return { ok: false, error: 'Incorrect code. Please try again.', status: 400 };
  }

  verification.verified = true;
  verification.verifiedAt = new Date();
  await verification.save();

  const downloadToken = jwt.sign(
    {
      purpose: DOWNLOAD_TOKEN_PURPOSE,
      verificationId: verification._id.toString(),
      resourceType: verification.resourceType,
      resourceId: verification.resourceId.toString(),
    },
    getJwtSecret(),
    { expiresIn: `${DOWNLOAD_TOKEN_EXPIRY_MINUTES}m` }
  );

  return { ok: true, downloadToken };
}

/** Validates a download token and returns its claims, or an error result. */
export function verifyDownloadToken(token) {
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (payload.purpose !== DOWNLOAD_TOKEN_PURPOSE) {
      return { ok: false, error: 'Invalid download token', status: 401 };
    }
    return { ok: true, payload };
  } catch (err) {
    return { ok: false, error: 'Download link has expired or is invalid', status: 401 };
  }
}

/** Marks the verification row as downloaded — best-effort, not part of the auth decision. */
export async function stampDownload(verificationId) {
  await connectDB();
  await Verification.findByIdAndUpdate(verificationId, { downloadedAt: new Date() });
}
