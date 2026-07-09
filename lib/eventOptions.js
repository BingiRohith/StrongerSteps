/**
 * Closed option set for Event.eventType — mirrors the
 * lib/membershipOptions.js pattern (single source of truth shared by
 * models/Event.js's enum validation and the admin EventForm's <select>),
 * kept out of the model file so client components can import it without
 * pulling mongoose into the browser bundle.
 */
export const EVENT_TYPE_VALUES = [
  'Workshop',
  'Webinar',
  'Seminar',
  'Meetup',
  'Health Camp',
  'Exercise Session',
  'Other',
];
