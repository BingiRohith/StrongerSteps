import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { escapeRegex } from '@/lib/escapeRegex.js';

// Sprint 19.6 production audit: 5 admin category search routes were
// interpolating raw search input straight into `{ $regex }` with no
// escaping (a ReDoS/regex-injection gap) — this is the shared helper
// extracted to fix that, matching the escaping already correct in
// app/api/admin/bookings/route.js.

describe('escapeRegex', () => {
  it('leaves plain alphanumeric input unchanged', () => {
    assert.equal(escapeRegex('balance training'), 'balance training');
  });

  it('escapes every regex metacharacter', () => {
    assert.equal(escapeRegex('.*+?^${}()|[]\\'), '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
  });

  it('neutralizes a catastrophic-backtracking pattern into a literal match', () => {
    const escaped = escapeRegex('(a+)+$');
    const regex = new RegExp(escaped, 'i');
    assert.equal(regex.test('(a+)+$'), true);
    assert.equal(regex.test('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!'), false);
  });

  it('defaults to an empty string for no input', () => {
    assert.equal(escapeRegex(), '');
  });
});
