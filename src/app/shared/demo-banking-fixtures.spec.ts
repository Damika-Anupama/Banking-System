import { DEMO_PROFILE, DEMO_TRANSACTIONS } from './demo-banking-fixtures';

/**
 * Fixture freshness: the seed data is date-rebased so it always reads as
 * recent. These specs pin that — absolute dates rotted twice before
 * (standing orders in Sprint 101, the ledger in Sprint 102).
 */
describe('demo fixture freshness', () => {
  const msPerDay = 86400000;
  const ageInDays = (iso: string) => (Date.now() - new Date(iso).getTime()) / msPerDay;

  it('keeps the newest ledger row within the last week, for every account', () => {
    // Accounts differ in authored activity (the corporate account is quieter),
    // but none may drift past a week — that is how the rot looked before.
    for (const [account, rows] of Object.entries(DEMO_TRANSACTIONS)) {
      const newestAge = Math.min(...rows.map(row => ageInDays(row.date)));
      expect(newestAge).withContext(account).toBeLessThan(7);
    }
  });

  it('keeps ledger rows newest-first after rebasing', () => {
    for (const rows of Object.values(DEMO_TRANSACTIONS)) {
      const times = rows.map(row => new Date(row.date).getTime());
      expect(times).toEqual([...times].sort((a, b) => b - a));
    }
  });

  it('reports a last login within the last day', () => {
    const age = ageInDays(DEMO_PROFILE.last_login);
    expect(age).toBeLessThan(1.5);
    expect(age).toBeGreaterThan(-1);
  });
});
