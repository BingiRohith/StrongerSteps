import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBookingNotificationPayload,
  notificationTypeForStatusChange,
  queueBookingNotification,
} from '@/lib/notifications/bookingNotifications.js';
import { getEmailProvider, getSmsProvider } from '@/lib/verification/providers/index.js';

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
