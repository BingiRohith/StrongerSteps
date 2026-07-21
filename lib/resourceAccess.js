import { canAccess } from '@/lib/access/canAccess';

/**
 * Sprint 19.3 — bridges lib/publicResources.js's plain DB fetches to
 * lib/access/canAccess.js's actor-aware authorization, mirroring
 * lib/courseAccess.js exactly. A ResourceFile's metadata (title,
 * description, fileType, displayOrder, accessLevel, previewAvailable,
 * downloadable) is always visible, so the public resource page can show a
 * full file list even for content the visitor can't open yet. The actual
 * content fields (file/externalUrl) are stripped entirely — not just
 * hidden client-side — when access is denied, so a gated file's private
 * storage key is never shipped to a browser that shouldn't have it
 * (defense in depth on top of
 * app/api/resource-files/[fileId]/route.js's own independent check).
 *
 * PURCHASED-level checks always resolve against the *resource* id, even
 * for a file-level gate — a visitor buys a resource, not an individual
 * file within it, same rule lib/courseAccess.js already established for
 * Course/Lesson.
 */
export function annotateResourceFileAccess(file, resource, actor) {
  // previewAvailable is the strongest override — bypasses every access
  // level, including OTP, same as Lesson.previewAvailable. Otherwise,
  // defer to canAccess() as-is (including its admin-override) so an admin
  // previewing a resource in the admin panel sees gated file content too.
  const allowed =
    file.previewAvailable ||
    canAccess(
      { accessLevel: file.accessLevel, resourceType: 'resource', resourceId: resource._id || resource.id },
      actor
    ).allowed;

  const { file: fileData, externalUrl, ...meta } = file;

  return {
    ...meta,
    locked: !allowed,
    // Still locked and OTP-gated (and not a free preview) — the page
    // signals "verify to unlock." The actual bytes are fetched only after
    // POST /api/verify/verify-otp succeeds, via the existing
    // app/api/verify/download route (resourceType 'resource').
    requiresOtp: file.accessLevel === 'OTP' && !allowed,
    ...(allowed ? { file: fileData, externalUrl } : {}),
  };
}

/** Applies annotateResourceFileAccess() to every file on a resource (from getResourceBySlug()). */
export function annotateResourceAccess(resource, actor) {
  if (!resource) return resource;
  return {
    ...resource,
    files: (resource.files || []).map((file) => annotateResourceFileAccess(file, resource, actor)),
  };
}
