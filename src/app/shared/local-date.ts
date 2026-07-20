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

/**
 * A short "time ago" label for an ISO timestamp — "just now", "5m ago",
 * "3h ago", "2d ago", "1w ago". The activity feed renders audit entries
 * relative to when the demo is viewed rather than as absolute dates, so a
 * freshly-recorded action reads as "just now" the moment it happens.
 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((now.getTime() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}
