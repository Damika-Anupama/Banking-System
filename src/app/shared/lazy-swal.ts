import { Injectable } from '@angular/core';
import type { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

/**
 * Opens a SweetAlert dialog, loading the library on demand.
 *
 * The error interceptor and the error handler live in CoreModule, so their
 * static `import Swal from 'sweetalert2'` dragged all 80kB of it into the
 * initial bundle — to serve two dialogs (a dead connection, an expired session)
 * that most sessions never see. Everything else that opens a dialog lives in a
 * lazily-loaded feature module and already pays for it only when reached.
 *
 * This is a service rather than a bare function so it can be injected and
 * mocked: a module-level dynamic import cannot be spied on in a unit test.
 */
@Injectable({ providedIn: 'root' })
export class AlertService {
  fire(options: SweetAlertOptions): Promise<SweetAlertResult<unknown>> {
    return import('sweetalert2').then(({ default: Swal }) => Swal.fire(options));
  }
}
