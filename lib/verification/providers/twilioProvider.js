import { isValidMobile, last10Digits } from '../../eventValidation.js';

/** Normalize local Indian input while preserving explicit E.164 destinations. */
export function smsRecipient(mobile) {
  if (isValidMobile(mobile)) return `+91${last10Digits(mobile)}`;
  return typeof mobile === 'string' && /^\+[1-9]\d{7,14}$/.test(mobile.trim()) ? mobile.trim() : null;
}

function getConfig() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_FROM_NUMBER,
  };
}

function buildText({ otp, text }) {
  return otp ? `Your StrongerSteps verification code is ${otp}. Do not share this code.` : text;
}

/** Twilio adapter for the shared SMS provider contract. */
export const twilioProvider = {
  name: 'twilio',
  async send({ to, otp, text }) {
    const { accountSid, authToken, from } = getConfig();
    if (!accountSid || !authToken || !from) {
      return { success: false, failureCode: 'provider-not-configured' };
    }

    const recipient = smsRecipient(to);
    if (!recipient) return { success: false, failureCode: 'invalid-recipient' };
    const body = new URLSearchParams({ To: recipient, From: from, Body: buildText({ otp, text }) });
    const encodedCredentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encodedCredentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) return { success: false, failureCode: 'provider-delivery-failed' };
    const result = await response.json().catch(() => ({}));
    return { success: true, providerRef: result?.sid || '' };
  },
};
