/**
 * Moves focus to the first field a form rejected.
 *
 * Submitting a long form and being told "check the highlighted fields" is only
 * useful if you can see the highlights. A keyboard user is left on the submit
 * button, and a screen-reader user hears the toast and then has to walk the
 * whole form to find out which field it meant. Putting focus on the offending
 * control answers "which one" immediately, and — because each control is now
 * wired to its message via aria-describedby — the reason is announced with it.
 */
export function focusFirstError(fieldName: string | null | undefined): void {
  if (!fieldName) return;

  // Deferred: the errors only exist after the touched state has rendered.
  setTimeout(() => {
    const control = document.querySelector<HTMLElement>(
      `[name="${CSS.escape(fieldName)}"]`
    );
    if (!control) return;

    control.focus({ preventScroll: true });
    control.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
}
