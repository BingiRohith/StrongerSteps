/**
 * Booking field validators shared by app/api/bookings/route.js (server,
 * source of truth) and components/programs/BookingModal.js (client, fast
 * feedback before submit) — same reuse pattern as lib/productPricing.js's
 * discountFromPrices being called from both a route and a form.
 */

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
// Indian mobile numbers: optional +91/91 prefix, then a 10-digit number starting 6-9.
const MOBILE_PATTERN = /^(?:\+?91[-\s]?)?[6-9]\d{9}$/;

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_PATTERN.test(email.trim());
}

export function isValidMobile(mobile) {
  return typeof mobile === 'string' && MOBILE_PATTERN.test(mobile.trim());
}

/**
 * Last 10 digits of a mobile number, stripping any +91/91 prefix and
 * whitespace — used to match a booking lookup's mobile input against
 * however the number was originally typed at booking time (with or
 * without a country code), since app/api/bookings/route.js stores it
 * trimmed but otherwise unnormalized.
 */
export function last10Digits(mobile) {
  const digits = String(mobile || '').replace(/\D/g, '');
  return digits.slice(-10);
}
