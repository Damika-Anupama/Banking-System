import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Opts a request out of the full-screen loading overlay.
 *
 * Set this on any request whose view already renders its own inline loading
 * state (a skeleton table, an inline spinner). Without it, a background fetch
 * dims and blocks the entire app on top of the placeholder the view is already
 * showing — two loading indicators for one fetch.
 *
 * The request is still tracked for timeouts and error handling; it just does
 * not raise the global overlay.
 */
export const SKIP_GLOBAL_LOADER = new HttpContextToken<boolean>(() => false);

/** Convenience for the common case: `this.http.get(url, skipGlobalLoader())`. */
export function skipGlobalLoader(): { context: HttpContext } {
  return { context: new HttpContext().set(SKIP_GLOBAL_LOADER, true) };
}
