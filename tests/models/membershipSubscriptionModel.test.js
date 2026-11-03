import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import MembershipSubscription from '@/models/MembershipSubscription.js';

// validateSync() covers schema-level rules without a DB connection —
// mirrors tests/models/toolModels.test.js's approach. The partial unique
// index (at most one pending-or-active subscription per lead) is a
// DB-enforced constraint and isn't exercised here; smoke-test it against a
// live MongoDB before relying on it.

const VALID_LEAD_ID = '507f1f77bcf86cd799439011';
const VALID_PLAN_ID = '507f1f77bcf86cd799439012';

describe('MembershipSubscription validation', () => {
  it('rejects a subscription with no lead or plan', () => {
    const subscription = new MembershipSubscription({});
    const error = subscription.validateSync();
    assert.ok(error);
    assert.ok(error.errors.lead);
    assert.ok(error.errors.plan);
  });

  it('accepts a subscription with just lead and plan, defaulting the rest', () => {
    const subscription = new MembershipSubscription({ lead: VALID_LEAD_ID, plan: VALID_PLAN_ID });
    const error = subscription.validateSync();
    assert.equal(error, undefined);
    assert.equal(subscription.status, 'pending');
    assert.equal(subscription.paymentStatus, 'pending');
    assert.equal(subscription.startsAt, null);
    assert.equal(subscription.expiresAt, null);
  });

  it('rejects an invalid status value', () => {
    const subscription = new MembershipSubscription({
      lead: VALID_LEAD_ID,
      plan: VALID_PLAN_ID,
      status: 'renewed', // not in the enum
    });
    const error = subscription.validateSync();
    assert.ok(error?.errors.status);
  });

  it('rejects an invalid paymentStatus value', () => {
    const subscription = new MembershipSubscription({
      lead: VALID_LEAD_ID,
      plan: VALID_PLAN_ID,
      paymentStatus: 'paid', // not yet a valid value this sprint (Sprint 19.7b widens this)
    });
    const error = subscription.validateSync();
    assert.ok(error?.errors.paymentStatus);
  });

  it('accepts every valid status/paymentStatus combination', () => {
    for (const status of ['pending', 'active', 'expired', 'cancelled']) {
      const subscription = new MembershipSubscription({ lead: VALID_LEAD_ID, plan: VALID_PLAN_ID, status });
      assert.equal(subscription.validateSync(), undefined, `expected status "${status}" to be valid`);
    }
    for (const paymentStatus of ['pending', 'manual']) {
      const subscription = new MembershipSubscription({ lead: VALID_LEAD_ID, plan: VALID_PLAN_ID, paymentStatus });
      assert.equal(subscription.validateSync(), undefined, `expected paymentStatus "${paymentStatus}" to be valid`);
    }
  });

  it('toSafeObject() exposes the expected plain fields', () => {
    const subscription = new MembershipSubscription({ lead: VALID_LEAD_ID, plan: VALID_PLAN_ID });
    const safe = subscription.toSafeObject();
    assert.equal(safe.id, subscription._id.toString());
    assert.equal(safe.status, 'pending');
    assert.equal(safe.paymentStatus, 'pending');
    assert.ok('startsAt' in safe);
    assert.ok('expiresAt' in safe);
    assert.ok('activatedAt' in safe);
    assert.ok('cancelledAt' in safe);
  });
});
