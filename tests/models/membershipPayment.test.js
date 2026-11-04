import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import MembershipPayment from '@/models/MembershipPayment.js';

const valid = { subscription: '507f1f77bcf86cd799439011', lead: '507f1f77bcf86cd799439012', amount: 10000, currency: 'INR', planName: 'Fixture', billingPeriod: 'monthly' };
describe('MembershipPayment', () => {
  it('requires identity, subscription and server price snapshot', () => {
    const error = new MembershipPayment({}).validateSync();
    for (const field of ['subscription', 'lead', 'amount', 'currency', 'planName', 'billingPeriod']) assert.ok(error.errors[field]);
  });
  it('leaves unused gateway references absent for sparse uniqueness', () => {
    const payment = new MembershipPayment(valid);
    assert.equal(payment.validateSync(), undefined);
    assert.equal(Object.hasOwn(payment.toObject(), 'orderId'), false);
    assert.equal(Object.hasOwn(payment.toObject(), 'paymentId'), false);
  });
  it('rejects unsupported currency and lifecycle values', () => {
    assert.ok(new MembershipPayment({ ...valid, currency: 'JPY' }).validateSync().errors.currency);
    assert.ok(new MembershipPayment({ ...valid, status: 'browser-says-paid' }).validateSync().errors.status);
  });
});
