/**
 * Today as a local YYYY-MM-DD string, for date-input floors and comparisons.
 *
 * `new Date().toISOString()` renders UTC: west of Greenwich it is still
 * "yesterday" in UTC every morning, and east of it "tomorrow" every evening —
 * either way a min="today" bound to it would be off by a day for part of the
 * day. Build the string from local date parts instead.
 */
export function localIsoToday(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * ISO date `days` from today (negative for the past), in local time.
 *
 * Demo fixtures use this instead of absolute dates: a seed written as
 * "2026-06-01" reads as "due soon" for a few weeks and then as "overdue by
 * N days" forever after.
 */
export function isoDaysFromNow(days: number, now: Date = new Date()): string {
  const shifted = new Date(now);
  shifted.setDate(shifted.getDate() + days);
  return localIsoToday(shifted);
}
