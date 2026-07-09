/**
 * Small formatting helpers shared by the public /programs calendar
 * (ProgramsCalendar/EventCard) and, where useful, the admin Events list —
 * kept dependency-free since react-calendar handles the actual month-grid
 * math; this file is just date-key grouping and display formatting.
 */

/**
 * 'YYYY-MM-DD' in local time — used to key react-calendar's own Date
 * objects (which are always constructed from local year/month/day, so
 * local getters are correct here).
 */
export function toDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 'YYYY-MM-DD' for an Event's `eventDate` field specifically. Event dates
 * are date-only values submitted as 'YYYY-MM-DD' strings from a date
 * input and stored as UTC midnight, so reading them back must use the UTC
 * calendar day — not the browser/server's local timezone — or the day can
 * appear to shift by one depending on where the code runs. Works for both
 * a Date instance and the ISO string it becomes after JSON serialization.
 */
export function eventDateKey(eventDate) {
  if (!eventDate) return '';
  const iso = eventDate instanceof Date ? eventDate.toISOString() : String(eventDate);
  return iso.slice(0, 10);
}

/** '14:30' -> '2:30 PM' */
export function formatTime12h(hhmm) {
  if (!hhmm) return '';
  const [hourStr, minuteStr] = hhmm.split(':');
  const hour = Number(hourStr);
  if (Number.isNaN(hour)) return hhmm;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minuteStr} ${period}`;
}

export function formatTimeRange(startTime, endTime) {
  if (!startTime && !endTime) return '';
  if (!endTime) return formatTime12h(startTime);
  return `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`;
}
