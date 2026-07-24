/**
 * Sort state for a table column, shared by every sortable table.
 *
 * Extracted from the transaction ledger rather than copied: the parts that are
 * easy to get subtly wrong — the three-state cycle, the stable tie-break, and
 * the aria-sort mapping — are worth having in exactly one place.
 */
export type SortDirection = 'asc' | 'desc';

/** How a column's value is read off a row. */
export type SortAccessor<T> = (row: T) => number | string;

export class TableSort<T> {
  column: string | null = null;
  direction: SortDirection = 'desc';

  constructor(private readonly accessors: Record<string, SortAccessor<T>>) {}

  /**
   * Cycles a column: descending, then ascending, then unsorted.
   *
   * The third state matters. A two-state toggle gives the user no way back to
   * the list's own order once they have sorted it.
   */
  toggle(column: string): void {
    if (this.column !== column) {
      this.column = column;
      this.direction = 'desc';
    } else if (this.direction === 'desc') {
      this.direction = 'asc';
    } else {
      this.column = null;
    }
  }

  /** The aria-sort value for a header, so the state is announced, not just drawn. */
  stateFor(column: string): 'ascending' | 'descending' | 'none' {
    if (this.column !== column) return 'none';
    return this.direction === 'asc' ? 'ascending' : 'descending';
  }

  /** Decorative arrow for the header. aria-sort carries the real meaning. */
  iconFor(column: string): string {
    if (this.column !== column) return 'fa-sort';
    return this.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  /** Returns a sorted copy. The input array is never mutated. */
  apply(rows: T[]): T[] {
    const column = this.column;
    const accessor = column ? this.accessors[column] : undefined;
    if (!accessor) return rows;

    const factor = this.direction === 'asc' ? 1 : -1;

    return rows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        const left = accessor(a.row);
        const right = accessor(b.row);
        if (left < right) return -1 * factor;
        if (left > right) return 1 * factor;
        // Tie-break on the original position, so equal rows keep a stable order
        // instead of reshuffling between change-detection passes.
        return a.index - b.index;
      })
      .map(({ row }) => row);
  }
}
