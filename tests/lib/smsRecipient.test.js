import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { smsRecipient } from '@/lib/verification/providers/twilioProvider.js';

describe('SMS recipient transport formatting', () => {
  it('formats local Indian mobile input as E.164', () => {
    assert.equal(smsRecipient('9876543210'), '+919876543210');
  });
  it('preserves the same destination for supported country-code formats', () => {
    for (const value of ['+919876543210', '919876543210', '+91 9876543210', '91-9876543210']) assert.equal(smsRecipient(value), '+919876543210');
    assert.equal(smsRecipient('+14155552671'), '+14155552671');
  });
  it('rejects invalid input rather than sending to a guessed destination', () => {
    for (const value of [undefined, null, '', '12345', '1234567890', '+00000000000']) assert.equal(smsRecipient(value), null);
  });
});
