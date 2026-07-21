import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { annotateResourceFileAccess, annotateResourceAccess } from '@/lib/resourceAccess.js';

// Mirrors tests/lib/courseAccess.test.js. lib/resourceAccess.js only
// imports the pure lib/access/canAccess.js, so this is testable with no
// DB/cookies.

const RESOURCE_ID = 'resource-1';

function baseFile(overrides = {}) {
  return {
    id: 'file-1',
    resource: RESOURCE_ID,
    title: 'Guide PDF',
    accessLevel: 'PUBLIC',
    previewAvailable: false,
    downloadable: true,
    file: { url: 'private-key.pdf', filename: 'guide.pdf' },
    externalUrl: '',
    ...overrides,
  };
}

function baseResource(overrides = {}) {
  return { _id: RESOURCE_ID, title: 'Healthy Ageing Guide', files: [], ...overrides };
}

describe('annotateResourceFileAccess — PUBLIC', () => {
  it('is always unlocked and keeps its content fields', () => {
    const result = annotateResourceFileAccess(baseFile(), baseResource(), {});
    assert.equal(result.locked, false);
    assert.equal(result.file.url, 'private-key.pdf');
  });
});

describe('annotateResourceFileAccess — MEMBER', () => {
  it('locks and strips content for a visitor with no active membership', () => {
    const result = annotateResourceFileAccess(baseFile({ accessLevel: 'MEMBER' }), baseResource(), {});
    assert.equal(result.locked, true);
    assert.equal(result.file, undefined);
    assert.equal(result.requiresOtp, false);
  });

  it('unlocks for a lead with an active membership', () => {
    const actor = { lead: { membership: 'plan-1', membershipExpiry: null } };
    const result = annotateResourceFileAccess(baseFile({ accessLevel: 'MEMBER' }), baseResource(), actor);
    assert.equal(result.locked, false);
    assert.equal(result.file.url, 'private-key.pdf');
  });
});

describe('annotateResourceFileAccess — PURCHASED', () => {
  it('checks the resource id, not the file id — a visitor buys the resource, not one file', () => {
    const actor = { lead: { purchasedItems: [{ resourceType: 'resource', resourceId: RESOURCE_ID }] } };
    const result = annotateResourceFileAccess(
      baseFile({ accessLevel: 'PURCHASED', id: 'file-99' }),
      baseResource(),
      actor
    );
    assert.equal(result.locked, false);
  });

  it('stays locked if the lead purchased a different resource', () => {
    const actor = { lead: { purchasedItems: [{ resourceType: 'resource', resourceId: 'some-other-resource' }] } };
    const result = annotateResourceFileAccess(baseFile({ accessLevel: 'PURCHASED' }), baseResource(), actor);
    assert.equal(result.locked, true);
  });
});

describe('annotateResourceFileAccess — OTP', () => {
  it('is locked with requiresOtp set, never unlocked by canAccess() alone', () => {
    const result = annotateResourceFileAccess(baseFile({ accessLevel: 'OTP' }), baseResource(), {});
    assert.equal(result.locked, true);
    assert.equal(result.requiresOtp, true);
    assert.equal(result.file, undefined);
  });

  it('IS unlocked by an admin session — admins can preview OTP-gated files without verifying against themselves', () => {
    const result = annotateResourceFileAccess(
      baseFile({ accessLevel: 'OTP' }),
      baseResource(),
      { user: { role: 'admin' } }
    );
    assert.equal(result.locked, false);
    assert.equal(result.requiresOtp, false);
    assert.equal(result.file.url, 'private-key.pdf');
  });
});

describe('annotateResourceFileAccess — previewAvailable override', () => {
  it('bypasses MEMBER/PURCHASED gates entirely', () => {
    for (const accessLevel of ['MEMBER', 'PURCHASED']) {
      const result = annotateResourceFileAccess(
        baseFile({ accessLevel, previewAvailable: true }),
        baseResource(),
        {}
      );
      assert.equal(result.locked, false, `${accessLevel} should unlock when previewAvailable`);
    }
  });

  it('bypasses OTP too — a free preview must not require a verification round-trip', () => {
    const result = annotateResourceFileAccess(
      baseFile({ accessLevel: 'OTP', previewAvailable: true }),
      baseResource(),
      {}
    );
    assert.equal(result.locked, false);
    assert.equal(result.requiresOtp, false);
    assert.equal(result.file.url, 'private-key.pdf');
  });
});

describe('annotateResourceFileAccess — metadata is always visible', () => {
  it('keeps title/accessLevel/previewAvailable/downloadable even when locked', () => {
    const result = annotateResourceFileAccess(
      baseFile({ accessLevel: 'MEMBER', title: 'Members-Only Checklist' }),
      baseResource(),
      {}
    );
    assert.equal(result.title, 'Members-Only Checklist');
    assert.equal(result.accessLevel, 'MEMBER');
    assert.equal(result.previewAvailable, false);
    assert.equal(result.downloadable, true);
  });
});

describe('annotateResourceAccess', () => {
  it('applies annotateResourceFileAccess to every file on the resource', () => {
    const resource = baseResource({
      files: [baseFile({ id: 'f1' }), baseFile({ id: 'f2', accessLevel: 'MEMBER' })],
    });
    const result = annotateResourceAccess(resource, {});
    assert.equal(result.files[0].locked, false);
    assert.equal(result.files[1].locked, true);
  });

  it('returns falsy input unchanged (no resource found upstream)', () => {
    assert.equal(annotateResourceAccess(null, {}), null);
  });
});
