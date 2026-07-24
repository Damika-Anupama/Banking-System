import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/shared/lazy-swal';

import { ErrorInterceptor } from './error-interceptor.interceptor';
import { ErrorHandlerService } from '../service/error-handler.service';
import { ToastService } from '../service/toast.service';

/**
 * Recoverable failures should surface as non-blocking toasts. Only the two
 * states the user genuinely cannot work through — an expired session and a
 * dead connection — are allowed to take over the screen with a modal.
 */
describe('ErrorInterceptor', () => {
  let alertService: AlertService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let toastService: ToastService;

  const TEST_URL = 'http://localhost:3000/api/test';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ErrorHandlerService,
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    toastService = TestBed.inject(ToastService);

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true }) as any);

    // SweetAlert is now loaded on demand behind AlertService, so the dialog
    // assertions spy on the service rather than the library.
    alertService = TestBed.inject(AlertService);
    spyOn(alertService, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true }) as any);
    spyOn(toastService, 'error');
    spyOn(toastService, 'warning');
  });

  afterEach(() => {
    httpMock.verify();
  });

  /** Fails a request with the given status, exhausting any automatic retries. */
  const failWith = (status: number, retries = 0) => {
    httpClient.get(TEST_URL).subscribe({ next: () => undefined, error: () => undefined });

    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) {
        // Retries use exponential backoff: 1s, 2s, 4s...
        tick(1000 * Math.pow(2, attempt - 1));
      }
      httpMock.expectOne(TEST_URL).flush({}, { status, statusText: 'Error' });
    }
    tick();
  };

  it('shows a non-blocking toast for a 403, not a modal', fakeAsync(() => {
    failWith(403);

    expect(toastService.error).toHaveBeenCalledWith('Access denied', jasmine.any(String));
    expect(alertService.fire).not.toHaveBeenCalled();
  }));

  it('shows a non-blocking toast for a 404, not a modal', fakeAsync(() => {
    failWith(404);

    expect(toastService.error).toHaveBeenCalledWith('Not found', jasmine.any(String));
    expect(alertService.fire).not.toHaveBeenCalled();
  }));

  it('warns without blocking once a timeout has exhausted its retries', fakeAsync(() => {
    failWith(408, 3);

    expect(toastService.warning).toHaveBeenCalledWith('Request timed out', jasmine.any(String));
    expect(alertService.fire).not.toHaveBeenCalled();
  }));

  it('warns without blocking when rate limited', fakeAsync(() => {
    failWith(429, 3);

    expect(toastService.warning).toHaveBeenCalledWith('Too many requests', jasmine.any(String));
    expect(alertService.fire).not.toHaveBeenCalled();
  }));

  it('reports the status code in the server error toast', fakeAsync(() => {
    failWith(503, 3);

    expect(toastService.error).toHaveBeenCalledWith('Server error', jasmine.stringMatching('503'));
    expect(alertService.fire).not.toHaveBeenCalled();
  }));

  it('still blocks with a modal when the session expires, since the user must re-authenticate', fakeAsync(() => {
    failWith(401);

    expect(alertService.fire).toHaveBeenCalled();
    expect(toastService.error).not.toHaveBeenCalled();
  }));

  it('clears stored credentials on an expired session', fakeAsync(() => {
    localStorage.setItem('token', 'stale-token');

    failWith(401);

    expect(localStorage.getItem('token')).toBeNull();
  }));

  it('still blocks with a modal when the connection is dead', fakeAsync(() => {
    failWith(0, 3);

    expect(alertService.fire).toHaveBeenCalled();
    expect(toastService.error).not.toHaveBeenCalled();
  }));
});
