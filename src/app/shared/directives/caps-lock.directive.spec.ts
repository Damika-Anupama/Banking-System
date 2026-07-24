import { CapsLockDirective } from './caps-lock.directive';

describe('CapsLockDirective', () => {
  let directive: CapsLockDirective;
  let emitted: boolean[];

  beforeEach(() => {
    directive = new CapsLockDirective();
    emitted = [];
    directive.appCapsLock.subscribe((value: boolean) => emitted.push(value));
  });

  function keyEvent(capsLock: boolean): KeyboardEvent {
    return new KeyboardEvent('keydown', { key: 'a', modifierCapsLock: capsLock });
  }

  it('emits true when a key is pressed with Caps Lock active', () => {
    directive.onKey(keyEvent(true));
    expect(emitted).toEqual([true]);
  });

  it('emits false when a key is pressed without Caps Lock', () => {
    directive.onKey(keyEvent(false));
    expect(emitted).toEqual([false]);
  });

  it('tracks the state across successive key presses', () => {
    directive.onKey(keyEvent(true));
    directive.onKey(keyEvent(false));
    expect(emitted).toEqual([true, false]);
  });

  it('clears the warning when the field loses focus', () => {
    directive.onKey(keyEvent(true));
    directive.onBlur();
    expect(emitted).toEqual([true, false]);
  });

  it('ignores events that cannot report modifier state', () => {
    const bare = { } as KeyboardEvent;
    directive.onKey(bare);
    expect(emitted).toEqual([]);
  });
});
