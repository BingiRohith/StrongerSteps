/**
 * Development/mock OTP provider — every real provider (Resend/SendGrid for
 * email, MSG91/Twilio/AWS SNS for SMS) implements this same `send()`
 * contract so lib/verification/verificationService.js never needs to
 * change when a real provider is wired in later.
 */
export const mockProvider = {
  async send({ to, otp, channel }) {
    // Intentionally the only place the plain OTP is ever visible outside the
    // request that generated it — never persisted, never logged elsewhere.
    console.log(`[MOCK ${channel.toUpperCase()} OTP] to=${to} otp=${otp}`);
    return { success: true, providerRef: `mock-${Date.now()}` };
  },
};
