import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmail, normalizeMobile, planLeadMerge } from '@/lib/verifiedLead.js';

// Only the pure decision logic is covered here — findOrCreateVerifiedLead,
// mergeVerifiedLeads, linkIdentifierToLead, linkUserToLead, and
// resolveActiveLead all require a live MongoDB connection, which (per this
// project's existing, documented precedent — see CHANGELOG.md's "Backend
// Foundation" entry) isn't available in this sandbox. Smoke-test those
// against a real database before relying on them.

describe('normalizeEmail', () => {
  it('lowercases and trims', () => {
    assert.equal(normalizeEmail('  Jane@Example.COM  '), 'jane@example.com');
  });

  it('returns null for empty/missing input', () => {
    assert.equal(normalizeEmail(''), null);
    assert.equal(normalizeEmail(null), null);
    assert.equal(normalizeEmail(undefined), null);
  });
});

describe('normalizeMobile', () => {
  it('strips a +91 prefix and whitespace down to the last 10 digits', () => {
    assert.equal(normalizeMobile('+91 98765 43210'), '9876543210');
    assert.equal(normalizeMobile('919876543210'), '9876543210');
    assert.equal(normalizeMobile('9876543210'), '9876543210');
  });

  it('returns null for anything shorter than 10 digits', () => {
    assert.equal(normalizeMobile('12345'), null);
    assert.equal(normalizeMobile(''), null);
    assert.equal(normalizeMobile(null), null);
  });
});

describe('planLeadMerge', () => {
  it('unions non-conflicting identity fields with no conflicts reported', () => {
    const primary = { email: 'a@example.com', mobile: null, name: 'A', identifierLinks: [] };
    const secondary = { email: null, mobile: '9876543210', name: '', identifierLinks: [] };

    const { merged, conflicts } = planLeadMerge(primary, secondary);

    assert.equal(conflicts.length, 0);
    assert.equal(merged.email, 'a@example.com');
    assert.equal(merged.mobile, '9876543210');
    assert.equal(merged.name, 'A');
  });

  it('flags a conflict when both sides hold different, non-null identity values', () => {
    const primary = { linkedUser: 'user-1', identifierLinks: [] };
    const secondary = { linkedUser: 'user-2', identifierLinks: [] };

    const { conflicts } = planLeadMerge(primary, secondary);

    assert.equal(conflicts.length, 1);
    assert.equal(conflicts[0].field, 'linkedUser');
    assert.equal(conflicts[0].primaryValue, 'user-1');
    assert.equal(conflicts[0].secondaryValue, 'user-2');
  });

  it('does not flag a conflict when the two sides hold the same value', () => {
    const primary = { membership: 'plan-1', identifierLinks: [] };
    const secondary = { membership: 'plan-1', identifierLinks: [] };

    const { conflicts } = planLeadMerge(primary, secondary);

    assert.equal(conflicts.length, 0);
  });

  it('unions and dedupes the orders/invoices array-id fields', () => {
    const primary = { orders: ['o1', 'o2'], identifierLinks: [] };
    const secondary = { orders: ['o2', 'o3'], identifierLinks: [] };

    const { merged } = planLeadMerge(primary, secondary);

    assert.deepEqual([...merged.orders].sort(), ['o1', 'o2', 'o3']);
  });

  it('concatenates the identifierLinks audit trail from both sides', () => {
    const primary = { identifierLinks: [{ type: 'email', value: 'a@example.com', method: 'otp' }] };
    const secondary = { identifierLinks: [{ type: 'mobile', value: '9876543210', method: 'otp' }] };

    const { merged } = planLeadMerge(primary, secondary);

    assert.equal(merged.identifierLinks.length, 2);
  });

  it('unions every declared array-id field automatically, not just the ones hand-picked in a test', () => {
    // Guards against the exact bug the ARRAY_ID_FIELDS refactor prevents:
    // a field silently dropped from the merge because it wasn't wired up
    // by hand. invoices wasn't exercised by the "orders/invoices" test above.
    const primary = { orders: ['o1'], invoices: [], identifierLinks: [] };
    const secondary = { orders: ['o1'], invoices: ['i1'], identifierLinks: [] };

    const { merged } = planLeadMerge(primary, secondary);

    assert.deepEqual(merged.orders, ['o1']);
    assert.deepEqual(merged.invoices, ['i1']);
  });

  it('dedupes bookmarks by (resourceType, resourceId), keeping the earlier savedAt', () => {
    const earlier = new Date('2026-01-01');
    const later = new Date('2026-02-01');
    const primary = {
      bookmarks: [{ resourceType: 'recipe', resourceId: 'r1', savedAt: later }],
      identifierLinks: [],
    };
    const secondary = {
      bookmarks: [
        { resourceType: 'recipe', resourceId: 'r1', savedAt: earlier },
        { resourceType: 'blog', resourceId: 'b1', savedAt: earlier },
      ],
      identifierLinks: [],
    };

    const { merged } = planLeadMerge(primary, secondary);

    assert.equal(merged.bookmarks.length, 2);
    const recipeBookmark = merged.bookmarks.find((b) => b.resourceType === 'recipe');
    assert.equal(recipeBookmark.savedAt.getTime(), earlier.getTime());
  });

  it('dedupes purchasedItems by (resourceType, resourceId), keeping the earlier purchasedAt', () => {
    // Same shape/logic as bookmarks above, exercised separately since
    // RESOURCE_REF_LIST_FIELDS drives both from one declared list — this
    // guards against a future edit to that list accidentally breaking one
    // field while "fixing" the other.
    const earlier = new Date('2026-01-01');
    const later = new Date('2026-02-01');
    const primary = {
      purchasedItems: [{ resourceType: 'course', resourceId: 'c1', purchasedAt: later }],
      identifierLinks: [],
    };
    const secondary = {
      purchasedItems: [
        { resourceType: 'course', resourceId: 'c1', purchasedAt: earlier },
        { resourceType: 'tool', resourceId: 't1', purchasedAt: earlier },
      ],
      identifierLinks: [],
    };

    const { merged } = planLeadMerge(primary, secondary);

    assert.equal(merged.purchasedItems.length, 2);
    const coursePurchase = merged.purchasedItems.find((p) => p.resourceType === 'course');
    assert.equal(coursePurchase.purchasedAt.getTime(), earlier.getTime());
  });

  it('keeps the earlier of two non-null verification timestamps', () => {
    const earlier = new Date('2026-01-01');
    const later = new Date('2026-02-01');
    const primary = { emailVerifiedAt: later, identifierLinks: [] };
    const secondary = { emailVerifiedAt: earlier, identifierLinks: [] };

    const { merged } = planLeadMerge(primary, secondary);

    assert.equal(merged.emailVerifiedAt.getTime(), earlier.getTime());
  });
});
