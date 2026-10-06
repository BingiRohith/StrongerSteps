/**
 * Development/mock OTP provider — every real provider (Resend/SendGrid for
 * email, MSG91/Twilio/AWS SNS for SMS) implements this same `send()`
 * contract so lib/verification/verificationService.js never needs to
 * change when a real provider is wired in later.
 */
export const mockProvider = {
  async send({ channel }) {
    // Development delivery is deliberately a no-op. Do not log recipients,
    // OTPs, or message content: local logs are not a secure delivery channel.
    return { success: true, providerRef: `mock-${Date.now()}` };
  },
};
