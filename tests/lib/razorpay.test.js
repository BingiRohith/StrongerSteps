import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyHmac, membershipPrice, assertPaymentMatches } from '@/lib/payments/razorpay.js';

describe('Razorpay signature validation', () => {
  const secret = 'unit-test-secret';
  const raw = '{ "event": "payment.captured" }';
  const signature = createHmac('sha256', secret).update(raw).digest('hex');
  it('accepts a valid signature for the exact raw bytes', () => assert.equal(verifyHmac(raw, signature, secret), true));
  it('rejects altered whitespace in signed webhooks', () => assert.equal(verifyHmac(JSON.stringify(JSON.parse(raw)), signature, secret), false));
  it('rejects wrong, missing, malformed and truncated signatures', () => {
    for (const bad of [undefined, '', 'zz'.repeat(32), signature.slice(1), '0'.repeat(64)]) assert.equal(verifyHmac(raw, bad, secret), false);
    assert.equal(verifyHmac(raw, signature, 'different'), false);
    assert.equal(verifyHmac(raw, signature, ''), false);
  });
  it('binds the checkout signature to the stored order and payment pair', () => {
    const sig = createHmac('sha256', secret).update('order_A|pay_B').digest('hex');
    assert.equal(verifyHmac('order_A|pay_B', sig, secret), true);
    assert.equal(verifyHmac('order_C|pay_B', sig, secret), false);
  });
});

describe('Membership payment amounts', () => {
  it('calculates integer minor units from server price and discount', () => assert.deepEqual(membershipPrice({ price: 1499.99, discountPercentage: 15, currency: 'INR' }), { amount: 127499, currency: 'INR' }));
  it('handles USD using cents', () => assert.equal(membershipPrice({ price: 10, currency: 'USD' }).amount, 1000));
  it('rejects free, invalid, unsafe and unsupported checkout prices', () => {
    for (const price of [0, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER]) assert.throws(() => membershipPrice({ price, currency: 'INR' }));
    assert.throws(() => membershipPrice({ price: 100, currency: 'JPY' }));
  });
  it('rejects an order, amount or currency mismatch', () => {
    const expected = { orderId: 'order_A', amount: 10000, currency: 'INR' };
    const actual = { order_id: 'order_A', amount: 10000, currency: 'INR' };
    assert.doesNotThrow(() => assertPaymentMatches(expected, actual));
    for (const changed of [{ order_id: 'order_B' }, { amount: 1 }, { currency: 'USD' }]) assert.throws(() => assertPaymentMatches(expected, { ...actual, ...changed }));
  });
});
