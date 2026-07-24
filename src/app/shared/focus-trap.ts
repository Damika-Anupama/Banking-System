/**
 * Keeps keyboard focus inside an open dialog.
 *
 * A dialog that declares aria-modal="true" is telling assistive tech that the
 * rest of the page is inert. If Tab can still walk out of it into the content
 * behind, that claim is a lie: a keyboard or screen-reader user ends up
 * operating a page they cannot see, with no way back.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Focusable elements inside `container`, in tab order, skipping hidden ones. */
export function focusableWithin(container: HTMLElement): HTMLElement[] {
  const nodes = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  );

  // offsetParent is null for display:none subtrees, which must not receive focus.
  return nodes.filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
}

/**
 * Handle a Tab keypress so focus cycles within `container` instead of escaping.
 * Returns true if the event was handled (and therefore already prevented).
 */
export function trapTabKey(event: KeyboardEvent, container: HTMLElement | null): boolean {
  if (event.key !== 'Tab' || !container) return false;

  const focusable = focusableWithin(container);
  if (focusable.length === 0) {
    // Nothing to focus inside: keep focus on the dialog rather than letting it
    // fall through to the page behind.
    event.preventDefault();
    return true;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;

  if (event.shiftKey && (active === first || !container.contains(active))) {
    event.preventDefault();
    last.focus();
    return true;
  }

  if (!event.shiftKey && (active === last || !container.contains(active))) {
    event.preventDefault();
    first.focus();
    return true;
  }

  return false;
}
