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
