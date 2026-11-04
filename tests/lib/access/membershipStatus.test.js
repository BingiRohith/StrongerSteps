import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getMembershipStatus, MEMBERSHIP_STATUSES } from '@/lib/access/membershipStatus.js';

describe('getMembershipStatus', () => {
  it('returns guest for no lead at all', () => {
    assert.equal(getMembershipStatus(null), MEMBERSHIP_STATUSES.GUEST);
    assert.equal(getMembershipStatus(undefined), MEMBERSHIP_STATUSES.GUEST);
  });

  it('returns registered for a lead that never had a membership', () => {
    const lead = { membership: null, membershipExpiry: null };
    assert.equal(getMembershipStatus(lead), MEMBERSHIP_STATUSES.REGISTERED);
  });

  it('returns active_member for a membership with no expiry set', () => {
    const lead = { membership: 'plan-1', membershipExpiry: null };
    assert.equal(getMembershipStatus(lead), MEMBERSHIP_STATUSES.ACTIVE_MEMBER);
  });

  it('returns active_member for a membership expiring in the future', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const lead = { membership: 'plan-1', membershipExpiry: future };
    assert.equal(getMembershipStatus(lead), MEMBERSHIP_STATUSES.ACTIVE_MEMBER);
  });

  it('returns expired_member for a membership whose expiry has passed', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const lead = { membership: 'plan-1', membershipExpiry: past };
    assert.equal(getMembershipStatus(lead), MEMBERSHIP_STATUSES.EXPIRED_MEMBER);
  });

  it('returns expired_member from membershipExpiry alone, even if membership itself is unset', () => {
    // Mirrors lib/membershipSubscription.js's convention: membershipExpiry
    // is never cleared back to null once set, so its mere presence is what
    // distinguishes a lapsed membership from "never had one" — this is the
    // signal getMembershipStatus() relies on, independent of `membership`.
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const lead = { membership: null, membershipExpiry: past };
    assert.equal(getMembershipStatus(lead), MEMBERSHIP_STATUSES.EXPIRED_MEMBER);
  });
});
