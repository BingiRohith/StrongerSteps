import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeExpiryFromBillingPeriod,
  shouldSyncLeadOnDeactivate,
  MembershipRequestConflictError,
  MembershipStateError,
} from '@/lib/membershipSubscription.js';

// Only the pure decision logic is covered here — createMembershipRequest,
// activateMembershipSubscription, expireMembershipSubscription, and
// cancelMembershipSubscription all require a live MongoDB connection with
// transaction support, which (per this project's existing, documented
// precedent) isn't available in this sandbox. Smoke-test the full
// idempotency/transition/transaction behavior against a real database
// before relying on it.

describe('computeExpiryFromBillingPeriod', () => {
  // Uses a mid-month local time (not midnight UTC) so this test isn't
  // sensitive to the runner's timezone shifting the date across a month
  // boundary — computeExpiryFromBillingPeriod itself operates on
  // local-time getMonth()/setMonth(), so assertions use the same local
  // getters rather than the UTC equivalents.
  const from = new Date(2026, 0, 15, 12, 0, 0); // 15 Jan 2026, local noon

  it('adds one month for monthly', () => {
    const result = computeExpiryFromBillingPeriod('monthly', from);
    assert.equal(result.getMonth(), 1); // February
  });

  it('adds three months for quarterly', () => {
    const result = computeExpiryFromBillingPeriod('quarterly', from);
    assert.equal(result.getMonth(), 3); // April
  });

  it('adds one year for yearly', () => {
    const result = computeExpiryFromBillingPeriod('yearly', from);
    assert.equal(result.getFullYear(), 2027);
  });

  it('never expires for one-time', () => {
    assert.equal(computeExpiryFromBillingPeriod('one-time', from), null);
  });

  it('never expires for free', () => {
    assert.equal(computeExpiryFromBillingPeriod('free', from), null);
  });

  it('defaults to never expiring for an unrecognized billing period', () => {
    assert.equal(computeExpiryFromBillingPeriod('fortnightly', from), null);
  });
});

describe('shouldSyncLeadOnDeactivate', () => {
  it('syncs when the lead\'s current membership still points at this plan', () => {
    const lead = { membership: 'plan-1' };
    assert.equal(shouldSyncLeadOnDeactivate(lead, 'plan-1'), true);
  });

  it('does not sync when the lead has since moved to a different plan', () => {
    // Guards against clobbering a newer active membership when an older,
    // already-superseded subscription is expired/cancelled after the fact.
    const lead = { membership: 'plan-2' };
    assert.equal(shouldSyncLeadOnDeactivate(lead, 'plan-1'), false);
  });

  it('does not sync when the lead has no current membership at all', () => {
    const lead = { membership: null };
    assert.equal(shouldSyncLeadOnDeactivate(lead, 'plan-1'), false);
  });

  it('does not sync for a missing lead', () => {
    assert.equal(shouldSyncLeadOnDeactivate(null, 'plan-1'), false);
  });

  it('compares ObjectId-like values by string, not reference', () => {
    const lead = { membership: { toString: () => 'plan-1' } };
    assert.equal(shouldSyncLeadOnDeactivate(lead, { toString: () => 'plan-1' }), true);
  });
});

describe('error classes', () => {
  it('MembershipRequestConflictError carries a message and name', () => {
    const err = new MembershipRequestConflictError('You already have a membership request in progress.');
    assert.equal(err.name, 'MembershipRequestConflictError');
    assert.equal(err.message, 'You already have a membership request in progress.');
  });

  it('MembershipStateError defaults to a 409 conflict status', () => {
    const err = new MembershipStateError('This subscription is already active.');
    assert.equal(err.name, 'MembershipStateError');
    assert.equal(err.status, 409);
  });

  it('MembershipStateError accepts an explicit status (e.g. 404)', () => {
    const err = new MembershipStateError('Membership subscription not found.', 404);
    assert.equal(err.status, 404);
  });
});
