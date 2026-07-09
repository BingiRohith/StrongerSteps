import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { createVerificationRequest } from '@/lib/verification/verificationService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/verify/generate-otp — public, reusable across any resource type
 * registered in lib/verification/resourceRegistry.js (not Knowledge-Center-
 * specific). Body: { resourceType, resourceId, method: 'email'|'mobile',
 * email?, mobile? }. Never returns the OTP itself.
 */
export const POST = withErrorHandling(async (request) => {
  const body = await request.json();
  const { resourceType, resourceId, method, email, mobile } = body || {};

  if (!resourceType || !resourceId) {
    return fail('resourceType and resourceId are required', 400);
  }

  const result = await createVerificationRequest({ resourceType, resourceId, method, email, mobile });
  if (!result.ok) {
    return fail(result.error, result.status);
  }

  return ok({ verificationId: result.verificationId }, 201);
});
