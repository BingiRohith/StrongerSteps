import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import NotificationDelivery from '@/models/NotificationDelivery.js';

const BOOKING_ID = '507f1f77bcf86cd799439011';
const EVENT_ID = '507f1f77bcf86cd799439012';

describe('NotificationDelivery validation', () => {
  it('accepts a minimal safe audit record without recipient or message fields', () => {
    const delivery = new NotificationDelivery({
      booking: BOOKING_ID,
      event: EVENT_ID,
      notificationType: 'booking-created',
      channel: 'email',
      provider: 'mock',
    });

    assert.equal(delivery.validateSync(), undefined);
    assert.equal(delivery.status, 'queued');
    assert.equal(delivery.providerRef, '');
  });

  it('rejects unknown notification types and channels', () => {
    const delivery = new NotificationDelivery({
      booking: BOOKING_ID,
      event: EVENT_ID,
      notificationType: 'marketing',
      channel: 'whatsapp',
      provider: 'mock',
    });

    const error = delivery.validateSync();
    assert.ok(error?.errors.notificationType);
    assert.ok(error?.errors.channel);
  });
});
