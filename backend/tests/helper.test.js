/**
 * Unit tests for backend/helper.js
 *
 * These functions are pure — no DB, no network, no env vars required.
 * Run: npx jest tests/helper.test.js
 */
const { getOffset, emptyOrRows } = require('../helper');

describe('getOffset', () => {
  test('first page returns 0', () => {
    expect(getOffset(1, 10)).toBe(0);
  });

  test('second page returns one page-worth of rows', () => {
    expect(getOffset(2, 10)).toBe(10);
  });

  test('third page with listPerPage=20 returns 40', () => {
    expect(getOffset(3, 20)).toBe(40);
  });

  test('defaults to page 1 when currentPage is omitted', () => {
    expect(getOffset(undefined, 10)).toBe(0);
  });

  test('large page numbers compute correctly', () => {
    expect(getOffset(100, 25)).toBe(2475);
  });
});

describe('emptyOrRows', () => {
  test('returns [] for null', () => {
    expect(emptyOrRows(null)).toEqual([]);
  });

  test('returns [] for undefined', () => {
    expect(emptyOrRows(undefined)).toEqual([]);
  });

  test('returns [] for falsy 0', () => {
    expect(emptyOrRows(0)).toEqual([]);
  });

  test('passes through a real rows array unchanged', () => {
    const rows = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
    expect(emptyOrRows(rows)).toBe(rows);
  });

  test('passes through an empty array (truthy) unchanged', () => {
    const rows = [];
    expect(emptyOrRows(rows)).toBe(rows);
  });
});
