import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, ensureUniqueSlug, estimateReadingTime } from '@/lib/slugify.js';

// Sprint 19.2's "Slug Generation" test requirement — models/Course.js and
// models/CourseCategory.js both use this shared helper (same pattern as
// every other slugged model in this project), which had no dedicated test
// file yet despite predating this sprint.

describe('slugify', () => {
  it('lowercases, trims, and hyphenates', () => {
    assert.equal(slugify('  Balance & Fall Prevention  '), 'balance-fall-prevention');
  });

  it('collapses repeated separators and strips leading/trailing hyphens', () => {
    assert.equal(slugify('---Foo   Bar___Baz---'), 'foo-bar-baz');
  });

  it('returns an empty string for empty input', () => {
    assert.equal(slugify(''), '');
  });
});

describe('ensureUniqueSlug', () => {
  it('returns the base slug unchanged when it is not taken', async () => {
    const slug = await ensureUniqueSlug('intro-to-balance', async () => false);
    assert.equal(slug, 'intro-to-balance');
  });

  it('appends -2, -3, ... until an untaken slug is found', async () => {
    const taken = new Set(['intro-to-balance', 'intro-to-balance-2', 'intro-to-balance-3']);
    const slug = await ensureUniqueSlug('intro-to-balance', async (candidate) => taken.has(candidate));
    assert.equal(slug, 'intro-to-balance-4');
  });

  it('falls back to "untitled" for an empty base slug', async () => {
    const slug = await ensureUniqueSlug('', async () => false);
    assert.equal(slug, 'untitled');
  });
});

describe('estimateReadingTime', () => {
  it('strips HTML tags before counting words', () => {
    const html = '<p>' + 'word '.repeat(400) + '</p>';
    assert.equal(estimateReadingTime(html), 2); // 400 words / 200 wpm
  });

  it('never returns less than 1 minute', () => {
    assert.equal(estimateReadingTime('short'), 1);
    assert.equal(estimateReadingTime(''), 1);
  });
});
