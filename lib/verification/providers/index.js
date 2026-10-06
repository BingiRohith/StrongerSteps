import { mockProvider } from './mockProvider.js';

/**
 * Provider factory — the only place that reads OTP_EMAIL_PROVIDER /
 * OTP_SMS_PROVIDER. Adding a real provider (Resend, SendGrid, MSG91,
 * Twilio, AWS SNS, ...) means adding one file here implementing the same
 * `send({ to, otp, channel })` contract as mockProvider, then adding a case
 * below — no change to verificationService.js, API routes, or the DB.
 */
export function getEmailProvider(providerName = process.env.OTP_EMAIL_PROVIDER || 'mock') {
  const name = providerName;
  switch (name) {
    case 'mock':
    default:
      return mockProvider;
  }
}

export function getSmsProvider(providerName = process.env.OTP_SMS_PROVIDER || 'mock') {
  const name = providerName;
  switch (name) {
    case 'mock':
    default:
      return mockProvider;
  }
}
