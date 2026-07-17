import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canAccess } from '@/lib/access/canAccess.js';
import { ACCESS_LEVELS } from '@/lib/access/accessLevels.js';

describe('canAccess — PUBLIC', () => {
  it('allows anyone, including a fully anonymous actor', () => {
    const result = canAccess({ accessLevel: ACCESS_LEVELS.PUBLIC }, {});
    assert.equal(result.allowed, true);
  });
});

describe('canAccess — ADMIN', () => {
  it('denies an anonymous visitor', () => {
    const result = canAccess({ accessLevel: ACCESS_LEVELS.ADMIN }, { user: null });
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'admin-required');
  });

  it('allows a signed-in admin/editor session', () => {
    const result = canAccess({ accessLevel: ACCESS_LEVELS.ADMIN }, { user: { role: 'editor' } });
    assert.equal(result.allowed, true);
  });
});

describe('canAccess — OTP', () => {
  it('is never a standing grant, even with a verified lead present', () => {
    const result = canAccess(
      { accessLevel: ACCESS_LEVELS.OTP },
      { lead: { email: 'a@example.com' } }
    );
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'otp-required');
  });
});

describe('canAccess — MEMBER', () => {
  it('denies a visitor with no lead at all', () => {
    const result = canAccess({ accessLevel: ACCESS_LEVELS.MEMBER }, {});
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'membership-required');
  });

  it('denies a verified lead with no membership', () => {
    const result = canAccess({ accessLevel: ACCESS_LEVELS.MEMBER }, { lead: { membership: null } });
    assert.equal(result.allowed, false);
  });

  it('allows a member with no expiry date set', () => {
    const result = canAccess(
      { accessLevel: ACCESS_LEVELS.MEMBER },
      { lead: { membership: 'plan-1', membershipExpiry: null } }
    );
    assert.equal(result.allowed, true);
  });

  it('allows a member whose expiry is in the future', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const result = canAccess(
      { accessLevel: ACCESS_LEVELS.MEMBER },
      { lead: { membership: 'plan-1', membershipExpiry: future } }
    );
    assert.equal(result.allowed, true);
  });

  it('denies a member whose expiry is in the past', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const result = canAccess(
      { accessLevel: ACCESS_LEVELS.MEMBER },
      { lead: { membership: 'plan-1', membershipExpiry: past } }
    );
    assert.equal(result.allowed, false);
  });
});

describe('canAccess — PURCHASED', () => {
  it('denies when the resource is absent from the lead\'s purchasedItems', () => {
    const result = canAccess(
      { accessLevel: ACCESS_LEVELS.PURCHASED, resourceType: 'course', resourceId: 'course-1' },
      { lead: { purchasedItems: [{ resourceType: 'course', resourceId: 'course-2' }] } }
    );
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'purchase-required');
  });

  it('allows when the (resourceType, resourceId) pair is present in purchasedItems', () => {
    const result = canAccess(
      { accessLevel: ACCESS_LEVELS.PURCHASED, resourceType: 'course', resourceId: 'course-1' },
      {
        lead: {
          purchasedItems: [
            { resourceType: 'course', resourceId: 'course-1' },
            { resourceType: 'tool', resourceId: 'tool-9' },
          ],
        },
      }
    );
    assert.equal(result.allowed, true);
  });

  it('does not match a resourceId owned under a different resourceType', () => {
    const result = canAccess(
      { accessLevel: ACCESS_LEVELS.PURCHASED, resourceType: 'course', resourceId: 'shared-id' },
      { lead: { purchasedItems: [{ resourceType: 'tool', resourceId: 'shared-id' }] } }
    );
    assert.equal(result.allowed, false);
  });
});

describe('canAccess — admin override', () => {
  it('lets an admin session through a MEMBER/PURCHASED/OTP gate by default', () => {
    const actor = { user: { role: 'admin' } };
    for (const accessLevel of [ACCESS_LEVELS.MEMBER, ACCESS_LEVELS.PURCHASED, ACCESS_LEVELS.OTP]) {
      const result = canAccess({ accessLevel }, actor);
      assert.equal(result.allowed, true, `expected admin override to allow ${accessLevel}`);
    }
  });

  it('can be disabled per call via allowAdminOverride: false', () => {
    const actor = { user: { role: 'admin' } };
    const result = canAccess({ accessLevel: ACCESS_LEVELS.MEMBER }, actor, { allowAdminOverride: false });
    assert.equal(result.allowed, false);
  });
});

describe('canAccess — invalid input', () => {
  it('denies an unrecognized access level rather than defaulting to allow', () => {
    const result = canAccess({ accessLevel: 'FREE_TIER' }, {});
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'invalid-access-level');
  });
});
