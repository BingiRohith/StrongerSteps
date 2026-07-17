import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DIFFICULTY_VALUES,
  difficultyLabel,
  LESSON_TYPE_VALUES,
  lessonTypeLabel,
} from '@/lib/courseOptions.js';

describe('courseOptions', () => {
  it('difficultyLabel resolves known values and falls back to the raw value for unknown ones', () => {
    assert.equal(difficultyLabel('Beginner'), 'Beginner');
    assert.equal(difficultyLabel('unknown-value'), 'unknown-value');
  });

  it('lessonTypeLabel resolves known values and falls back to the raw value for unknown ones', () => {
    assert.equal(lessonTypeLabel('video'), 'Video');
    assert.equal(lessonTypeLabel('external_link'), 'External Link');
    assert.equal(lessonTypeLabel('unknown-value'), 'unknown-value');
  });

  it('DIFFICULTY_VALUES and LESSON_TYPE_VALUES are non-empty, deduplicated value lists', () => {
    assert.ok(DIFFICULTY_VALUES.length > 0);
    assert.equal(new Set(DIFFICULTY_VALUES).size, DIFFICULTY_VALUES.length);
    assert.ok(LESSON_TYPE_VALUES.length > 0);
    assert.equal(new Set(LESSON_TYPE_VALUES).size, LESSON_TYPE_VALUES.length);
  });
});
