import { TableSort } from './table-sort';

interface Row {
  name: string;
  amount: number;
}

describe('TableSort', () => {
  let sort: TableSort<Row>;
  let rows: Row[];

  beforeEach(() => {
    sort = new TableSort<Row>({
      name: (r) => r.name.toLowerCase(),
      amount: (r) => r.amount,
    });

    rows = [
      { name: 'Beta', amount: 500 },
      { name: 'Alpha', amount: 9000 },
      { name: 'Gamma', amount: 100 },
    ];
  });

  const amounts = () => sort.apply(rows).map((r) => r.amount);

  it('starts unsorted, preserving the source order', () => {
    expect(sort.column).toBeNull();
    expect(amounts()).toEqual([500, 9000, 100]);
  });

  it('sorts descending on the first click of a column', () => {
    sort.toggle('amount');

    expect(sort.direction).toBe('desc');
    expect(amounts()).toEqual([9000, 500, 100]);
  });

  it('cycles descending, ascending, then back to unsorted', () => {
    sort.toggle('amount');
    sort.toggle('amount');
    expect(sort.direction).toBe('asc');
    expect(amounts()).toEqual([100, 500, 9000]);

    // The third state is the way back to the list's own order; a two-state
    // toggle would strand the user in a sort they cannot undo.
    sort.toggle('amount');
    expect(sort.column).toBeNull();
    expect(amounts()).toEqual([500, 9000, 100]);
  });

  it('starts a newly chosen column descending', () => {
    sort.toggle('amount');
    sort.toggle('amount'); // amount ascending

    sort.toggle('name');

    expect(sort.column).toBe('name');
    expect(sort.direction).toBe('desc');
  });

  it('never mutates the array it is given', () => {
    const original = [...rows];
    sort.toggle('amount');

    sort.apply(rows);

    expect(rows).toEqual(original);
  });

  it('keeps equal rows in their original order', () => {
    const tied: Row[] = [
      { name: 'First', amount: 100 },
      { name: 'Second', amount: 100 },
      { name: 'Third', amount: 100 },
    ];
    sort.toggle('amount');

    // Without a stable tie-break, equal rows can reshuffle on every change
    // detection pass, making the table visibly twitch.
    expect(sort.apply(tied).map((r) => r.name)).toEqual(['First', 'Second', 'Third']);
  });

  it('leaves rows alone for a column it has no accessor for', () => {
    sort.toggle('unknown');

    expect(amounts()).toEqual([500, 9000, 100]);
  });

  it('exposes sort state for assistive tech', () => {
    expect(sort.stateFor('amount')).toBe('none');

    sort.toggle('amount');
    expect(sort.stateFor('amount')).toBe('descending');
    expect(sort.stateFor('name')).toBe('none');

    sort.toggle('amount');
    expect(sort.stateFor('amount')).toBe('ascending');
  });

  it('maps each state to a distinct header icon', () => {
    expect(sort.iconFor('amount')).toBe('fa-sort');

    sort.toggle('amount');
    expect(sort.iconFor('amount')).toBe('fa-sort-down');

    sort.toggle('amount');
    expect(sort.iconFor('amount')).toBe('fa-sort-up');
  });
});
