import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Course from '@/models/Course.js';
import CourseCategory from '@/models/CourseCategory.js';
import Section from '@/models/Section.js';
import Lesson from '@/models/Lesson.js';

// Covers this sprint's "Validation" and (the schema-level half of) "Course
// CRUD / Section CRUD / Lesson CRUD" requirements. Mongoose's
// `validateSync()` runs every synchronous schema rule (required/enum/
// maxlength) without a DB connection and without invoking the models' own
// async pre('validate') hooks (slug generation, publishedAt stamping) —
// confirmed empirically before writing these tests. It does NOT cover:
// slug uniqueness (needs a DB query), the publish-lifecycle hook, or any
// route-handler-level validation (category-exists checks, cross-field
// rules) — those need a live MongoDB, same standing limitation as every
// other model in this project's test suite (see tests/lib/verifiedLead.test.js).

const VALID_CATEGORY_ID = '507f1f77bcf86cd799439011';
const VALID_COURSE_ID = '507f1f77bcf86cd799439012';
const VALID_SECTION_ID = '507f1f77bcf86cd799439013';

describe('Course validation', () => {
  it('rejects a course with no title or category', () => {
    const course = new Course({});
    const error = course.validateSync();
    assert.ok(error);
    assert.ok(error.errors.title);
    assert.ok(error.errors.category);
  });

  it('accepts a course with just title and category (everything else defaults)', () => {
    const course = new Course({ title: 'Balance & Fall Prevention', category: VALID_CATEGORY_ID });
    const error = course.validateSync();
    assert.equal(error, undefined);
    assert.equal(course.status, 'draft');
    assert.equal(course.accessLevel, 'PUBLIC');
    assert.equal(course.difficulty, 'Beginner');
  });

  it('rejects an invalid difficulty value', () => {
    const course = new Course({
      title: 'Test Course',
      category: VALID_CATEGORY_ID,
      difficulty: 'Expert', // not in DIFFICULTY_VALUES
    });
    const error = course.validateSync();
    assert.ok(error?.errors.difficulty);
  });

  it('rejects an invalid accessLevel value', () => {
    const course = new Course({
      title: 'Test Course',
      category: VALID_CATEGORY_ID,
      accessLevel: 'FREE_TIER', // not a real ACCESS_LEVELS value
    });
    const error = course.validateSync();
    assert.ok(error?.errors.accessLevel);
  });

  it('rejects a title over the 200-character limit', () => {
    const course = new Course({ title: 'x'.repeat(201), category: VALID_CATEGORY_ID });
    const error = course.validateSync();
    assert.ok(error?.errors.title);
  });
});

describe('CourseCategory validation', () => {
  it('rejects a category with no name', () => {
    const category = new CourseCategory({});
    const error = category.validateSync();
    assert.ok(error?.errors.name);
  });

  it('accepts a category with just a name', () => {
    const category = new CourseCategory({ name: 'Balance & Mobility' });
    const error = category.validateSync();
    assert.equal(error, undefined);
    assert.equal(category.isActive, true);
  });
});

describe('Section validation', () => {
  it('rejects a section with no course or title', () => {
    const section = new Section({});
    const error = section.validateSync();
    assert.ok(error?.errors.course);
    assert.ok(error?.errors.title);
  });

  it('accepts a section with course and title', () => {
    const section = new Section({ course: VALID_COURSE_ID, title: 'Week 1: Foundations' });
    const error = section.validateSync();
    assert.equal(error, undefined);
    assert.equal(section.displayOrder, 0);
    assert.equal(section.collapsedByDefault, false);
  });
});

describe('Lesson validation', () => {
  it('rejects a lesson with no section, course, or title', () => {
    const lesson = new Lesson({});
    const error = lesson.validateSync();
    assert.ok(error?.errors.section);
    assert.ok(error?.errors.course);
    assert.ok(error?.errors.title);
  });

  it('accepts a minimal lesson and defaults lessonType/accessLevel', () => {
    const lesson = new Lesson({ section: VALID_SECTION_ID, course: VALID_COURSE_ID, title: 'Intro' });
    const error = lesson.validateSync();
    assert.equal(error, undefined);
    assert.equal(lesson.lessonType, 'text');
    assert.equal(lesson.accessLevel, 'PUBLIC');
    assert.equal(lesson.previewAvailable, false);
  });

  it('rejects an invalid lessonType', () => {
    const lesson = new Lesson({
      section: VALID_SECTION_ID,
      course: VALID_COURSE_ID,
      title: 'Intro',
      lessonType: 'audio', // not in LESSON_TYPE_VALUES
    });
    const error = lesson.validateSync();
    assert.ok(error?.errors.lessonType);
  });

  it('rejects a negative estimatedDuration', () => {
    const lesson = new Lesson({
      section: VALID_SECTION_ID,
      course: VALID_COURSE_ID,
      title: 'Intro',
      estimatedDuration: -5,
    });
    const error = lesson.validateSync();
    assert.ok(error?.errors.estimatedDuration);
  });

  it('accepts every declared access level', () => {
    for (const accessLevel of ['PUBLIC', 'OTP', 'MEMBER', 'PURCHASED', 'ADMIN']) {
      const lesson = new Lesson({ section: VALID_SECTION_ID, course: VALID_COURSE_ID, title: 'Intro', accessLevel });
      const error = lesson.validateSync();
      assert.equal(error, undefined, `accessLevel ${accessLevel} should be valid`);
    }
  });
});
