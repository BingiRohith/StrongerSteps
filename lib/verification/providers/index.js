import { mockProvider } from './mockProvider.js';
import { resendProvider } from './resendProvider.js';
import { twilioProvider } from './twilioProvider.js';

/**
 * Shared provider factory. OTP calls use the OTP_* defaults; notification
 * calls pass their own provider selection. Adding a provider means adding one
 * adapter with the common send contract and one case below — callers and DB
 * schemas remain unchanged.
 */
export function getEmailProvider(providerName = process.env.OTP_EMAIL_PROVIDER || 'mock') {
  const name = providerName;
  switch (name) {
    case 'resend':
      return resendProvider;
    case 'mock':
    default:
      return mockProvider;
  }
}

export function getSmsProvider(providerName = process.env.OTP_SMS_PROVIDER || 'mock') {
  const name = providerName;
  switch (name) {
    case 'twilio':
      return twilioProvider;
    case 'mock':
    default:
      return mockProvider;
  }
}
