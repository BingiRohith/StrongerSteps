/**
 * Sprint 19.5 — pure URL parsing for multi-source lesson video
 * (models/Lesson.js's `video.source`). No DB/cookie/request dependency, so
 * it's safe to import from both server code (validation on save) and
 * client admin/public components (live preview) — same "pure, unit-tested"
 * shape as lib/access/canAccess.js.
 *
 * Only 'upload' lessons are served through the gated
 * /api/lessons/[id]/media route; youtube/vimeo/external all embed a
 * visitor-supplied URL directly, so this function is also the one place
 * that rejects anything that isn't a real http(s) URL before it's ever
 * saved.
 */

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be']);
const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);

function safeParseUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed;
  } catch {
    return null;
  }
}

function extractYoutubeId(parsed) {
  if (parsed.hostname === 'youtu.be' || parsed.hostname === 'www.youtu.be') {
    return parsed.pathname.slice(1).split('/')[0] || null;
  }
  if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
  const embedMatch = parsed.pathname.match(/^\/(embed|shorts)\/([^/]+)/);
  if (embedMatch) return embedMatch[2];
  return null;
}

function extractVimeoId(parsed) {
  const match = parsed.pathname.match(/(\d+)/);
  return match ? match[1] : null;
}

/**
 * @param {string} url
 * @returns {{ provider: 'youtube'|'vimeo'|'external'|null, embedUrl: string|null, videoId: string|null }}
 */
export function parseVideoUrl(url) {
  const parsed = safeParseUrl((url || '').trim());
  if (!parsed) return { provider: null, embedUrl: null, videoId: null };

  if (YOUTUBE_HOSTS.has(parsed.hostname)) {
    const videoId = extractYoutubeId(parsed);
    if (!videoId) return { provider: null, embedUrl: null, videoId: null };
    return { provider: 'youtube', embedUrl: `https://www.youtube.com/embed/${videoId}`, videoId };
  }

  if (VIMEO_HOSTS.has(parsed.hostname)) {
    const videoId = extractVimeoId(parsed);
    if (!videoId) return { provider: null, embedUrl: null, videoId: null };
    return { provider: 'vimeo', embedUrl: `https://player.vimeo.com/video/${videoId}`, videoId };
  }

  // Any other http(s) URL — 'external'. A direct file link (.mp4/.webm/.ogg)
  // is playable in a plain <video> tag; anything else falls back to an
  // <iframe> (the caller decides which, via isDirectVideoFile()).
  return { provider: 'external', embedUrl: parsed.toString(), videoId: null };
}

/** Whether an 'external' video URL looks like a direct media file (vs. a page needing an <iframe>). */
export function isDirectVideoFile(url) {
  return /\.(mp4|webm|ogg|ogv)(\?.*)?$/i.test((url || '').trim());
}

/** True for any non-empty URL this module can recognize as embeddable/playable. */
export function isValidVideoUrl(url) {
  return parseVideoUrl(url).provider !== null;
}
