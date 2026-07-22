import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseVideoUrl, isDirectVideoFile, isValidVideoUrl } from '@/lib/videoEmbed.js';

describe('parseVideoUrl — YouTube', () => {
  it('parses a standard watch URL', () => {
    const result = parseVideoUrl('https://www.youtube.com/watch?v=abc123XYZ');
    assert.equal(result.provider, 'youtube');
    assert.equal(result.videoId, 'abc123XYZ');
    assert.equal(result.embedUrl, 'https://www.youtube.com/embed/abc123XYZ');
  });

  it('parses a youtu.be short link', () => {
    const result = parseVideoUrl('https://youtu.be/abc123XYZ');
    assert.equal(result.provider, 'youtube');
    assert.equal(result.videoId, 'abc123XYZ');
  });

  it('parses an existing embed URL', () => {
    const result = parseVideoUrl('https://www.youtube.com/embed/abc123XYZ');
    assert.equal(result.provider, 'youtube');
    assert.equal(result.videoId, 'abc123XYZ');
  });
});

describe('parseVideoUrl — Vimeo', () => {
  it('parses a standard Vimeo URL', () => {
    const result = parseVideoUrl('https://vimeo.com/123456789');
    assert.equal(result.provider, 'vimeo');
    assert.equal(result.videoId, '123456789');
    assert.equal(result.embedUrl, 'https://player.vimeo.com/video/123456789');
  });
});

describe('parseVideoUrl — external / invalid', () => {
  it('treats any other http(s) URL as external', () => {
    const result = parseVideoUrl('https://cdn.example.com/videos/lesson1.mp4');
    assert.equal(result.provider, 'external');
    assert.equal(result.embedUrl, 'https://cdn.example.com/videos/lesson1.mp4');
  });

  it('rejects non-http(s) protocols', () => {
    const result = parseVideoUrl('javascript:alert(1)');
    assert.equal(result.provider, null);
  });

  it('rejects malformed input', () => {
    const result = parseVideoUrl('not a url');
    assert.equal(result.provider, null);
  });

  it('rejects empty input', () => {
    const result = parseVideoUrl('');
    assert.equal(result.provider, null);
  });
});

describe('isDirectVideoFile', () => {
  it('recognizes a direct .mp4 link', () => {
    assert.equal(isDirectVideoFile('https://cdn.example.com/a.mp4'), true);
  });

  it('recognizes a direct link with a query string', () => {
    assert.equal(isDirectVideoFile('https://cdn.example.com/a.webm?token=xyz'), true);
  });

  it('rejects a non-media page URL', () => {
    assert.equal(isDirectVideoFile('https://example.com/watch/lesson1'), false);
  });
});

describe('isValidVideoUrl', () => {
  it('is true for a recognized provider', () => {
    assert.equal(isValidVideoUrl('https://vimeo.com/123456789'), true);
  });

  it('is false for garbage input', () => {
    assert.equal(isValidVideoUrl('not a url'), false);
  });
});
