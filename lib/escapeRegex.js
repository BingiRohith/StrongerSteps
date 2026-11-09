/**
 * Escapes RegExp metacharacters in user-supplied search input before it's
 * interpolated into a `new RegExp(...)`/`{ $regex }` filter. Without this,
 * a search query containing regex syntax (e.g. `(a+)+$`) is passed straight
 * through as a live pattern — a ReDoS/regex-injection risk on any
 * admin-facing search endpoint. Matches the escaping already used in
 * app/api/admin/bookings/route.js; extracted here so every other
 * `search`-based admin route can reuse the same, already-correct pattern.
 */
export function escapeRegex(input = '') {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
