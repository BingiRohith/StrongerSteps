/**
 * In-memory sliding-window rate limiter (Sprint 17 hardening) — same
 * "single always-on Node server" assumption already documented for local
 * upload storage in docs/09_DEPLOYMENT.md, so a per-instance Map is
 * sufficient defense-in-depth against brute-force login attempts without
 * adding a new DB collection/schema for it. Not reset on deploy/restart
 * beyond process lifetime, which is fine for this purpose.
 */
const buckets = new Map();

/**
 * Returns true if `key` has made fewer than `max` calls within `windowMs`,
 * and records this call. Callers should key by something like
 * `${email}:${ip}` so one bad actor can't lock out a legitimate user.
 */
export function isRateLimited(key, { max, windowMs }) {
  const now = Date.now();
  const timestamps = (buckets.get(key) || []).filter((t) => now - t < windowMs);

  if (timestamps.length >= max) {
    buckets.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return false;
}
