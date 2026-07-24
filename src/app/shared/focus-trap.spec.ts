import { focusableWithin, trapTabKey } from './focus-trap';

describe('focus-trap', () => {
  let container: HTMLElement;

  const tab = (shiftKey = false): KeyboardEvent =>
    new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true });

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <button id="first">First</button>
      <input id="middle" />
      <button id="last">Last</button>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  const byId = (id: string) => document.getElementById(id) as HTMLElement;

  it('lists focusable children in tab order', () => {
    expect(focusableWithin(container).map((el) => el.id)).toEqual([
      'first',
      'middle',
      'last',
    ]);
  });

  it('skips disabled controls', () => {
    (byId('middle') as HTMLInputElement).disabled = true;

    expect(focusableWithin(container).map((el) => el.id)).toEqual(['first', 'last']);
  });

  it('ignores keys other than Tab', () => {
    const event = new KeyboardEvent('keydown', { key: 'a', cancelable: true });

    expect(trapTabKey(event, container)).toBe(false);
  });

  it('wraps forward from the last element back to the first', () => {
    byId('last').focus();
    const event = tab();

    expect(trapTabKey(event, container)).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(byId('first'));
  });

  it('wraps backward from the first element to the last', () => {
    byId('first').focus();
    const event = tab(true);

    expect(trapTabKey(event, container)).toBe(true);
    expect(document.activeElement).toBe(byId('last'));
  });

  it('lets Tab move naturally between elements in the middle', () => {
    byId('first').focus();
    const event = tab();

    // Not at an edge, so the browser's own tab order is left alone.
    expect(trapTabKey(event, container)).toBe(false);
    expect(event.defaultPrevented).toBe(false);
  });

  it('pulls focus back in when it has escaped the container', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();

    const event = tab();
    expect(trapTabKey(event, container)).toBe(true);
    expect(document.activeElement).toBe(byId('first'));

    document.body.removeChild(outside);
  });

  it('holds focus rather than releasing it when the container has nothing focusable', () => {
    const empty = document.createElement('div');
    document.body.appendChild(empty);

    const event = tab();
    expect(trapTabKey(event, empty)).toBe(true);
    expect(event.defaultPrevented).toBe(true);

    document.body.removeChild(empty);
  });

  it('does nothing when there is no container', () => {
    expect(trapTabKey(tab(), null)).toBe(false);
  });
});
