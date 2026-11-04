/**
 * Sprint 19.7a — shared, client-safe UI copy for membership request state.
 * Deliberately its own dependency-free module (not lib/membershipSubscription.js,
 * which imports Mongoose models and can't be bundled into a 'use client'
 * component) so both server pages and client components import the exact
 * same string without duplicating it.
 *
 * Deliberately generic and payment-automation-agnostic — reused everywhere
 * a `pending` subscription is shown (the /join request confirmation, the
 * dashboard's subscription history) so Sprint 19.7b's Razorpay
 * auto-activation doesn't make the wording inaccurate.
 */
export const MEMBERSHIP_PENDING_MESSAGE =
  "Membership request submitted successfully. We'll review it and notify you once it becomes active.";
