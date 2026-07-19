import { localIsoToday } from './local-date';

describe('localIsoToday', () => {
  it('renders local date parts, zero-padded', () => {
    expect(localIsoToday(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('renders double-digit months and days without padding artifacts', () => {
    expect(localIsoToday(new Date(2026, 11, 25))).toBe('2026-12-25');
  });

  it('uses the local calendar day, not the UTC one', () => {
    // 23:30 local on Jan 5 is already Jan 6 in UTC for zones west of UTC-0:30,
    // and toISOString would report the UTC day. The helper must not.
    const lateEvening = new Date(2026, 0, 5, 23, 30);
    expect(localIsoToday(lateEvening)).toBe('2026-01-05');
  });

  it('compares correctly against ISO date strings', () => {
    // The whole point: "past date" checks are plain string comparisons.
    expect('2026-01-04' < localIsoToday(new Date(2026, 0, 5))).toBeTrue();
    expect('2026-01-06' > localIsoToday(new Date(2026, 0, 5))).toBeTrue();
  });
});
