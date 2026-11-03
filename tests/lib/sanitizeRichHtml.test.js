import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeRichHtml } from '@/lib/sanitizeRichHtml';

test('sanitizeRichHtml removes executable markup and unsafe URLs', () => {
  const result = sanitizeRichHtml(
    '<p onclick="steal()">Safe</p><script>alert(1)</script>' +
      '<img src="javascript:alert(1)" onerror="steal()">' +
      '<a href="javascript:steal()">bad link</a>'
  );

  assert.equal(result.includes('script'), false);
  assert.equal(result.includes('onclick'), false);
  assert.equal(result.includes('onerror'), false);
  assert.equal(result.includes('javascript:'), false);
  assert.match(result, /<p>Safe<\/p>/);
});

test('sanitizeRichHtml preserves supported lesson editor formatting', () => {
  const result = sanitizeRichHtml(
    '<h2>Heading</h2><p class="callout callout-tip unknown">Tip</p>' +
      '<table><tbody><tr><th colspan="2">A</th></tr></tbody></table>' +
      '<img src="/api/lessons/abc/media?fileKind=body-image-0" alt="Exercise">' +
      '<a href="https://example.com" target="_blank">Read</a>'
  );

  assert.match(result, /<h2>Heading<\/h2>/);
  assert.match(result, /class="callout callout-tip"/);
  assert.equal(result.includes('unknown'), false);
  assert.match(result, /<th colspan="2">A<\/th>/);
  assert.match(result, /src="\/api\/lessons\/abc\/media\?fileKind=body-image-0"/);
  assert.match(result, /rel="noopener noreferrer"/);
});
