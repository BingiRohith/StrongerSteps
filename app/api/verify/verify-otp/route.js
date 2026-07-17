import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { verifyOtp } from '@/lib/verification/verificationService';
import { findOrCreateVerifiedLead, linkIdentifierToLead } from '@/lib/verifiedLead';
import { getCurrentLead, signLeadToken, setLeadCookie } from '@/lib/access/leadSession';

export const dynamic = 'force-dynamic';

/**
 * POST /api/verify/verify-otp — public. Body: { verificationId, otp }.
 * On success returns a short-lived signed download token — never a
 * permanent download URL — for use with GET /api/verify/download.
 *
 * Sprint 19.1B: every successful OTP verification is also the "verify once"
 * moment CRS asks for — it upserts/links a VerifiedLead and refreshes the
 * long-lived lead session cookie, so any future OTP-gated resource (not
 * just Infographics) automatically builds the same shared identity with no
 * extra per-module code. If the browser already carries an active lead
 * session, the newly-proven identifier is linked to that same lead
 * (strong evidence — see lib/verifiedLead.js's linkIdentifierToLead)
 * instead of creating a second one.
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

  const existingLead = await getCurrentLead(request);
  const identifierValue = result.method === 'email' ? result.email : result.mobile;
  const lead = existingLead
    ? await linkIdentifierToLead(existingLead._id, { type: result.method, value: identifierValue, method: 'otp' })
    : await findOrCreateVerifiedLead({ email: result.email, mobile: result.mobile, method: result.method });

  const response = ok({ downloadToken: result.downloadToken });
  setLeadCookie(response, signLeadToken(lead));
  return response;
});
