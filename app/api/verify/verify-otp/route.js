import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { verifyOtp } from '@/lib/verification/verificationService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/verify/verify-otp — public. Body: { verificationId, otp }.
 * On success returns a short-lived signed download token — never a
 * permanent download URL — for use with GET /api/verify/download.
 */
export const POST = withErrorHandling(async (request) => {
  const body = await request.json();
  const { verificationId, otp } = body || {};

  if (!verificationId || !otp) {
    return fail('verificationId and otp are required', 400);
  }

  const result = await verifyOtp({ verificationId, otp });
  if (!result.ok) {
    return fail(result.error, result.status);
  }

  return ok({ downloadToken: result.downloadToken });
});
