import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { annotateLessonAccess, annotateCourseAccess } from '@/lib/courseAccess.js';

// Covers this sprint's "Access Control" requirement. lib/courseAccess.js
// only imports the pure lib/access/canAccess.js, so this is testable with
// no DB/cookies, same as tests/lib/access/canAccess.test.js.

const COURSE_ID = 'course-1';

function baseLesson(overrides = {}) {
  return {
    id: 'lesson-1',
    course: COURSE_ID,
    title: 'Intro',
    accessLevel: 'PUBLIC',
    previewAvailable: false,
    video: { url: 'private-key.mp4', filename: 'intro.mp4' },
    pdf: { url: '', filename: '' },
    image: { url: '', alt: '' },
    externalUrl: '',
    body: '',
    attachments: [],
    ...overrides,
  };
}

describe('annotateLessonAccess — PUBLIC', () => {
  it('is always unlocked and keeps its content fields', () => {
    const result = annotateLessonAccess(baseLesson(), {});
    assert.equal(result.locked, false);
    assert.equal(result.video.url, 'private-key.mp4');
  });
});

describe('annotateLessonAccess — MEMBER', () => {
  it('locks and strips content for a visitor with no active membership', () => {
    const result = annotateLessonAccess(baseLesson({ accessLevel: 'MEMBER' }), {});
    assert.equal(result.locked, true);
    assert.equal(result.video, undefined);
    assert.equal(result.requiresOtp, false);
  });

  it('unlocks for a lead with an active membership', () => {
    const actor = { lead: { membership: 'plan-1', membershipExpiry: null } };
    const result = annotateLessonAccess(baseLesson({ accessLevel: 'MEMBER' }), actor);
    assert.equal(result.locked, false);
    assert.equal(result.video.url, 'private-key.mp4');
  });
});

describe('annotateLessonAccess — PURCHASED', () => {
  it('checks the course id, not the lesson id — a visitor buys the course, not one lesson', () => {
    const actor = { lead: { purchasedItems: [{ resourceType: 'course', resourceId: COURSE_ID }] } };
    const result = annotateLessonAccess(baseLesson({ accessLevel: 'PURCHASED', id: 'lesson-99' }), actor);
    assert.equal(result.locked, false);
  });

  it('stays locked if the lead purchased a different course', () => {
    const actor = { lead: { purchasedItems: [{ resourceType: 'course', resourceId: 'some-other-course' }] } };
    const result = annotateLessonAccess(baseLesson({ accessLevel: 'PURCHASED' }), actor);
    assert.equal(result.locked, true);
  });
});

describe('annotateLessonAccess — OTP', () => {
  it('is locked with requiresOtp set, never unlocked by canAccess() alone', () => {
    const result = annotateLessonAccess(baseLesson({ accessLevel: 'OTP' }), {});
    assert.equal(result.locked, true);
    assert.equal(result.requiresOtp, true);
    assert.equal(result.video, undefined);
  });

  it('IS unlocked by an admin session — admins can preview OTP-gated lesson content without verifying against themselves', () => {
    const result = annotateLessonAccess(baseLesson({ accessLevel: 'OTP' }), { user: { role: 'admin' } });
    assert.equal(result.locked, false);
    assert.equal(result.requiresOtp, false);
    assert.equal(result.video.url, 'private-key.mp4');
  });
});

describe('annotateLessonAccess — previewAvailable override', () => {
  it('bypasses MEMBER/PURCHASED gates entirely', () => {
    for (const accessLevel of ['MEMBER', 'PURCHASED']) {
      const result = annotateLessonAccess(baseLesson({ accessLevel, previewAvailable: true }), {});
      assert.equal(result.locked, false, `${accessLevel} should unlock when previewAvailable`);
    }
  });

  it('bypasses OTP too — a free preview must not require a verification round-trip', () => {
    const result = annotateLessonAccess(baseLesson({ accessLevel: 'OTP', previewAvailable: true }), {});
    assert.equal(result.locked, false);
    assert.equal(result.requiresOtp, false);
    assert.equal(result.video.url, 'private-key.mp4');
  });
});

describe('annotateLessonAccess — metadata is always visible', () => {
  it('keeps title/accessLevel/previewAvailable even when locked', () => {
    const result = annotateLessonAccess(baseLesson({ accessLevel: 'MEMBER', title: 'Advanced Balance Drills' }), {});
    assert.equal(result.title, 'Advanced Balance Drills');
    assert.equal(result.accessLevel, 'MEMBER');
    assert.equal(result.previewAvailable, false);
  });
});

describe('annotateCourseAccess', () => {
  it('applies annotateLessonAccess to every lesson in every section', () => {
    const course = {
      _id: COURSE_ID,
      sections: [
        {
          _id: 'section-1',
          lessons: [baseLesson({ id: 'l1' }), baseLesson({ id: 'l2', accessLevel: 'MEMBER' })],
        },
      ],
    };
    const result = annotateCourseAccess(course, {});
    assert.equal(result.sections[0].lessons[0].locked, false);
    assert.equal(result.sections[0].lessons[1].locked, true);
  });

  it('returns falsy input unchanged (no course found upstream)', () => {
    assert.equal(annotateCourseAccess(null, {}), null);
  });
});
