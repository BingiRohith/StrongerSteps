import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Team from '@/models/Team.js';

// Sprint 19.4 — covers the additive specialization/contact fields added for
// the tree -> card grid redesign. Mirrors tests/models/resourceModels.test.js's
// validateSync()-only approach (no DB connection needed).

describe('Team validation', () => {
  it('rejects a member with no name or designation', () => {
    const member = new Team({});
    const error = member.validateSync();
    assert.ok(error?.errors.name);
    assert.ok(error?.errors.designation);
  });

  it('accepts a member with just name and designation (everything else defaults)', () => {
    const member = new Team({ name: 'Dr. Nikhil', designation: 'Co-Founder' });
    const error = member.validateSync();
    assert.equal(error, undefined);
    assert.equal(member.status, 'draft');
    assert.deepEqual(member.specialization, []);
    assert.equal(member.contact.email, '');
    assert.equal(member.contact.phone, '');
  });

  it('trims and filters empty specialization entries, same convention as qualifications', () => {
    const member = new Team({
      name: 'Dr. Akhila',
      designation: 'Co-Founder',
      specialization: [' Geriatric Medicine ', '', 'Palliative Rehabilitation'],
    });
    assert.deepEqual(member.specialization, ['Geriatric Medicine', 'Palliative Rehabilitation']);
  });

  it('accepts optional contact email/phone', () => {
    const member = new Team({
      name: 'Dr. Nikhil',
      designation: 'Co-Founder',
      contact: { email: 'Doctor@Example.com', phone: '+91 98765 43210' },
    });
    const error = member.validateSync();
    assert.equal(error, undefined);
    assert.equal(member.contact.email, 'doctor@example.com');
    assert.equal(member.contact.phone, '+91 98765 43210');
  });

  it('still defaults parentMember/xPosition/yPosition even though the UI no longer sets them', () => {
    const member = new Team({ name: 'Dr. Nikhil', designation: 'Co-Founder' });
    assert.equal(member.parentMember, null);
    assert.equal(member.xPosition, 50);
    assert.equal(member.yPosition, 50);
  });
});
