import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import VerifiedLead from '@/models/VerifiedLead.js';

// Regression coverage for a bug found during Sprint 19.7a verification:
// email/mobile used to default to explicit `null`, which defeats MongoDB's
// sparse unique index (it only excludes a field that's entirely *absent*,
// not one explicitly set to null) — see scripts/migrateVerifiedLeadNulls.mjs
// and models/VerifiedLead.js's updated field comments for the full story.
// validateSync()/toObject() cover the schema-level fix without a DB
// connection; the live-Mongo repro (two email-only leads created
// back-to-back, previously threw E11000) was verified separately against
// a real database.

describe('VerifiedLead email/mobile defaults', () => {
  it('leaves mobile truly absent (not null) when only email is provided', () => {
    const lead = new VerifiedLead({ email: 'a@example.com' });
    assert.equal(lead.mobile, undefined);
    assert.equal('mobile' in lead.toObject(), false);
  });

  it('leaves email truly absent (not null) when only mobile is provided', () => {
    const lead = new VerifiedLead({ mobile: '9876543210' });
    assert.equal(lead.email, undefined);
    assert.equal('email' in lead.toObject(), false);
  });

  it('validates fine with neither identifier set (both fully absent)', () => {
    const lead = new VerifiedLead({});
    const error = lead.validateSync();
    assert.equal(error, undefined);
    assert.equal('email' in lead.toObject(), false);
    assert.equal('mobile' in lead.toObject(), false);
  });
});

describe('VerifiedLead email/mobile null-to-undefined setter', () => {
  it('converts an explicit null assignment on email to undefined', () => {
    const lead = new VerifiedLead({ email: 'a@example.com', mobile: '9876543210' });
    lead.email = null;
    assert.equal(lead.email, undefined);
    assert.equal('email' in lead.toObject(), false);
  });

  it('converts an explicit null assignment on mobile to undefined', () => {
    const lead = new VerifiedLead({ email: 'a@example.com', mobile: '9876543210' });
    lead.mobile = null;
    assert.equal(lead.mobile, undefined);
    assert.equal('mobile' in lead.toObject(), false);
  });

  it('mirrors mergeVerifiedLeads\' tombstoning of a merged-away lead (both cleared via null)', () => {
    // Same assignment shape as lib/verifiedLead.js's mergeVerifiedLeads():
    // secondary.email = null; secondary.mobile = null;
    const lead = new VerifiedLead({ email: 'a@example.com', mobile: '9876543210' });
    lead.email = null;
    lead.mobile = null;
    const obj = lead.toObject();
    assert.equal('email' in obj, false);
    assert.equal('mobile' in obj, false);
  });
});
