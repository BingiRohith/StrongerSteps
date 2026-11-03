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

    const body = new URLSearchParams({ To: to, From: from, Body: buildText({ otp, text }) });
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
