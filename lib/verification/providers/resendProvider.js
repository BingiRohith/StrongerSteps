function getConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM_EMAIL,
  };
}

function buildMessage({ otp, subject, text }) {
  if (otp) {
    return {
      subject: 'Your StrongerSteps verification code',
      text: `Your StrongerSteps verification code is ${otp}. Do not share this code.`,
    };
  }
  return { subject, text };
}

/** Resend adapter for the shared email provider contract. */
export const resendProvider = {
  name: 'resend',
  async send({ to, otp, subject, text }) {
    const { apiKey, from } = getConfig();
    if (!apiKey || !from) {
      return { success: false, failureCode: 'provider-not-configured' };
    }

    const message = buildMessage({ otp, subject, text });
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject: message.subject, text: message.text }),
    });

    if (!response.ok) return { success: false, failureCode: 'provider-delivery-failed' };
    const body = await response.json().catch(() => ({}));
    return { success: true, providerRef: body?.id || '' };
  },
};
