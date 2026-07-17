import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

before(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-not-real';
});

const { signLeadToken, verifyLeadToken, setLeadCookie, clearLeadCookie, LEAD_COOKIE_NAME } =
  await import('@/lib/access/leadToken.js');

function fakeResponse() {
  const calls = [];
  return { cookies: { set: (opts) => calls.push(opts) }, calls };
}

describe('signLeadToken / verifyLeadToken', () => {
  it('round-trips a lead id', () => {
    const token = signLeadToken({ _id: 'lead-123' });
    const payload = verifyLeadToken(token);
    assert.equal(payload.leadId, 'lead-123');
    assert.equal(payload.purpose, 'lead');
  });

  it('accepts a plain string id as well as a doc-like object', () => {
    const token = signLeadToken('lead-456');
    const payload = verifyLeadToken(token);
    assert.equal(payload.leadId, 'lead-456');
  });

  it('rejects a token signed for a different purpose (e.g. the admin/download token)', () => {
    const foreignToken = jwt.sign({ purpose: 'download', leadId: 'lead-123' }, process.env.JWT_SECRET);
    assert.equal(verifyLeadToken(foreignToken), null);
  });

  it('rejects a garbage/invalid token', () => {
    assert.equal(verifyLeadToken('not-a-real-token'), null);
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign({ purpose: 'lead', leadId: 'lead-123' }, process.env.JWT_SECRET, { expiresIn: -10 });
    assert.equal(verifyLeadToken(expired), null);
  });
});

describe('setLeadCookie / clearLeadCookie', () => {
  it('sets an httpOnly cookie with the configured name and a non-empty value', () => {
    const res = fakeResponse();
    setLeadCookie(res, 'some-token');
    assert.equal(res.calls.length, 1);
    assert.equal(res.calls[0].name, LEAD_COOKIE_NAME);
    assert.equal(res.calls[0].value, 'some-token');
    assert.equal(res.calls[0].httpOnly, true);
    assert.ok(res.calls[0].maxAge > 0);
  });

  it('clears the cookie with an empty value and zero maxAge', () => {
    const res = fakeResponse();
    clearLeadCookie(res);
    assert.equal(res.calls[0].value, '');
    assert.equal(res.calls[0].maxAge, 0);
  });
});
