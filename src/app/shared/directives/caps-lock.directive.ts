import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

/**
 * Emits whether Caps Lock is active while the host field is being used.
 *
 * Masked password inputs hide the one visual cue that would reveal an
 * accidental Caps Lock, so forms attach this to password fields and show an
 * inline warning instead of letting the sign-in fail mysteriously.
 */
@Directive({
  selector: '[appCapsLock]',
  standalone: false,
})
export class CapsLockDirective {
  @Output() appCapsLock = new EventEmitter<boolean>();

  @HostListener('keydown', ['$event'])
  @HostListener('keyup', ['$event'])
  onKey(event: KeyboardEvent): void {
    // Older browsers and synthetic events may not carry modifier state.
    if (typeof event.getModifierState !== 'function') return;
    this.appCapsLock.emit(event.getModifierState('CapsLock'));
  }

  /** The warning is only useful while typing here; clear it when focus leaves. */
  @HostListener('blur')
  onBlur(): void {
    this.appCapsLock.emit(false);
  }
}
