import { ShortcutHelpComponent } from './shortcut-help.component';

describe('ShortcutHelpComponent', () => {
  let component: ShortcutHelpComponent;

  beforeEach(() => {
    component = new ShortcutHelpComponent();
  });

  function questionKey(target: EventTarget | null = document.body): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key: '?' });
    Object.defineProperty(event, 'target', { value: target });
    return event;
  }

  it('opens on "?" pressed outside a text field', () => {
    component.onGlobalKeyDown(questionKey());
    expect(component.isOpen).toBeTrue();
  });

  it('toggles closed on a second "?"', () => {
    component.onGlobalKeyDown(questionKey());
    component.onGlobalKeyDown(questionKey());
    expect(component.isOpen).toBeFalse();
  });

  it('ignores "?" typed into an input, textarea, or editable node', () => {
    for (const tag of ['input', 'textarea', 'select']) {
      component.onGlobalKeyDown(questionKey(document.createElement(tag)));
      expect(component.isOpen).withContext(tag).toBeFalse();
    }

    const editable = document.createElement('div');
    Object.defineProperty(editable, 'isContentEditable', { value: true });
    component.onGlobalKeyDown(questionKey(editable));
    expect(component.isOpen).toBeFalse();
  });

  it('closes on Escape and stops the event from reaching dialogs underneath', () => {
    component.open();
    const escape = new KeyboardEvent('keydown', { key: 'Escape' });
    const stop = spyOn(escape, 'stopPropagation');

    component.onGlobalKeyDown(escape);

    expect(component.isOpen).toBeFalse();
    expect(stop).toHaveBeenCalled();
  });

  it('returns focus to the opener on close', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    component.open();
    component.close();

    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
