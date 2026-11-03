import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBookingNotificationPayload,
  notificationTypeForStatusChange,
  queueBookingNotification,
} from '@/lib/notifications/bookingNotifications.js';
import { getEmailProvider, getSmsProvider } from '@/lib/verification/providers/index.js';
import { resendProvider } from '@/lib/verification/providers/resendProvider.js';
import { twilioProvider } from '@/lib/verification/providers/twilioProvider.js';

const booking = {
  _id: 'booking-id',
  name: 'Asha',
  email: 'asha@example.test',
  mobile: '9876543210',
  bookingReference: 'SS-20261006-0001',
};

const event = {
  _id: 'event-id',
  title: 'Balance Workshop',
  eventDate: '2026-11-04T00:00:00.000Z',
  startTime: '10:00 AM',
};

describe('booking notification payloads', () => {
  it('uses concise booking/event details without recipient contact values', () => {
    const payload = buildBookingNotificationPayload({ booking, event, notificationType: 'booking-created' });

    assert.equal(payload.subject, 'Your StrongerSteps booking');
    assert.match(payload.emailText, /Hello Asha/);
    assert.match(payload.emailText, /Balance Workshop on 4 Nov 2026, 10:00 AM/);
    assert.match(payload.emailText, /SS-20261006-0001/);
    assert.doesNotMatch(payload.emailText, /asha@example\.test|9876543210/);
    assert.match(payload.smsText, /confirmed/);
  });

  it('uses cancellation-specific content', () => {
    const payload = buildBookingNotificationPayload({ booking, event, notificationType: 'booking-cancelled' });

    assert.match(payload.subject, /cancelled/);
    assert.match(payload.emailText, /was cancelled/);
  });
});

describe('notification provider fallback', () => {
  it('uses the safe mock provider for unsupported email and SMS provider names', async () => {
    const emailResult = await getEmailProvider('not-configured').send({ channel: 'email' });
    const smsResult = await getSmsProvider('not-configured').send({ channel: 'sms' });

    assert.equal(emailResult.success, true);
    assert.match(emailResult.providerRef, /^mock-/);
    assert.equal(smsResult.success, true);
    assert.match(smsResult.providerRef, /^mock-/);
  });

  it('selects the configured Resend and Twilio adapters', () => {
    assert.equal(getEmailProvider('resend'), resendProvider);
    assert.equal(getSmsProvider('twilio'), twilioProvider);
  });

  it('fails safely without calling a network provider when credentials are absent', async () => {
    const originalFetch = globalThis.fetch;
    const previousKey = process.env.RESEND_API_KEY;
    const previousFrom = process.env.RESEND_FROM_EMAIL;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    globalThis.fetch = async () => assert.fail('fetch should not run without provider credentials');

    try {
      const result = await resendProvider.send({ to: 'asha@example.test', subject: 'Test', text: 'Test' });
      assert.deepEqual(result, { success: false, failureCode: 'provider-not-configured' });
    } finally {
      globalThis.fetch = originalFetch;
      if (previousKey === undefined) delete process.env.RESEND_API_KEY;
      else process.env.RESEND_API_KEY = previousKey;
      if (previousFrom === undefined) delete process.env.RESEND_FROM_EMAIL;
      else process.env.RESEND_FROM_EMAIL = previousFrom;
    }
  });

  it('maps successful provider responses to safe provider references', async () => {
    const originalFetch = globalThis.fetch;
    const previous = {
      resendKey: process.env.RESEND_API_KEY,
      resendFrom: process.env.RESEND_FROM_EMAIL,
      sid: process.env.TWILIO_ACCOUNT_SID,
      token: process.env.TWILIO_AUTH_TOKEN,
      twilioFrom: process.env.TWILIO_FROM_NUMBER,
    };
    process.env.RESEND_API_KEY = 'test-key';
    process.env.RESEND_FROM_EMAIL = 'noreply@example.test';
    process.env.TWILIO_ACCOUNT_SID = 'account';
    process.env.TWILIO_AUTH_TOKEN = 'token';
    process.env.TWILIO_FROM_NUMBER = '+15555550100';
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return { ok: true, json: async () => (calls === 1 ? { id: 'email-ref' } : { sid: 'sms-ref' }) };
    };

    try {
      assert.deepEqual(await resendProvider.send({ to: 'asha@example.test', subject: 'Test', text: 'Test' }), {
        success: true,
        providerRef: 'email-ref',
      });
      assert.deepEqual(await twilioProvider.send({ to: '+15555550101', text: 'Test' }), {
        success: true,
        providerRef: 'sms-ref',
      });
    } finally {
      globalThis.fetch = originalFetch;
      for (const [key, value] of Object.entries(previous)) {
        const envName = {
          resendKey: 'RESEND_API_KEY', resendFrom: 'RESEND_FROM_EMAIL', sid: 'TWILIO_ACCOUNT_SID',
          token: 'TWILIO_AUTH_TOKEN', twilioFrom: 'TWILIO_FROM_NUMBER',
        }[key];
        if (value === undefined) delete process.env[envName];
        else process.env[envName] = value;
      }
    }
  });
});

describe('post-write notification guard', () => {
  it('does not queue delivery when a booking write failed', async () => {
    let calls = 0;
    const queued = queueBookingNotification(
      { writeSucceeded: false, booking, event, notificationType: 'booking-created' },
      async () => {
        calls += 1;
      }
    );

    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(queued, false);
    assert.equal(calls, 0);
  });

  it('queues delivery only for a completed write', async () => {
    let received;
    const queued = queueBookingNotification(
      { writeSucceeded: true, booking, event, notificationType: 'booking-created' },
      async (input) => {
        received = input;
      }
    );

    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(queued, true);
    assert.equal(received.booking, booking);
  });

  it('selects status notifications only for actual confirmed or cancelled changes', () => {
    assert.equal(notificationTypeForStatusChange('pending', 'confirmed'), 'booking-confirmed');
    assert.equal(notificationTypeForStatusChange('confirmed', 'cancelled'), 'booking-cancelled');
    assert.equal(notificationTypeForStatusChange('confirmed', 'confirmed'), null);
    assert.equal(notificationTypeForStatusChange('confirmed', 'completed'), null);
  });
});
