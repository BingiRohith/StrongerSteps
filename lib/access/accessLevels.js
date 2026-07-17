/**
 * Sprint 19.1B — the reusable access-level vocabulary every future content
 * module (Course/Resource/Tool, and the existing Infographic OTP gate)
 * should share instead of each module inventing its own Free/Premium/Paid
 * flags. See docs/14_ACCESS_CONTROL.md for the full authorization model.
 */
export const ACCESS_LEVELS = {
  PUBLIC: 'PUBLIC',       // no verification required
  OTP: 'OTP',             // requires a valid, resource-scoped download token (see app/api/verify/*)
  MEMBER: 'MEMBER',       // requires a VerifiedLead with an active (non-expired) Membership
  PURCHASED: 'PURCHASED', // requires the resource's id in the lead's matching purchased-list array
  ADMIN: 'ADMIN',         // requires an authenticated admin/editor session (lib/auth.js)
};

export const ACCESS_LEVEL_VALUES = Object.values(ACCESS_LEVELS);

export function isValidAccessLevel(value) {
  return ACCESS_LEVEL_VALUES.includes(value);
}
