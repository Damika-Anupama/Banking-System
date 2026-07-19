import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, retryWhen, mergeMap, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AlertService } from '../shared/lazy-swal';
import { ErrorHandlerService } from '../service/error-handler.service';
import { ToastService } from '../service/toast.service';
import { removeStorage } from 'src/app/shared/safe-storage';

/**
 * Global HTTP Error Interceptor
 *
 * Intercepts all HTTP errors and provides:
 * - Automatic retry logic with exponential backoff
 * - Status code-specific error handling
 * - User notifications
 * - Logging
 * - Authentication/authorization error handling
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  // Maximum number of retry attempts for transient failures
  private readonly MAX_RETRIES = 3;

  // Initial delay for exponential backoff (in milliseconds)
  private readonly INITIAL_DELAY = 1000;

  // Status codes that should trigger automatic retry
  private readonly RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

  constructor(
    private router: Router,
    private errorHandlerService: ErrorHandlerService,
    private toastService: ToastService,
    private alertService: AlertService
  ) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, index) => {
            const retryAttempt = index + 1;

            // Check if error is retryable
            if (this.shouldRetry(error, retryAttempt)) {
              const delayTime = this.calculateBackoffDelay(retryAttempt);

              console.warn(
                `[HTTP Retry] Attempt ${retryAttempt}/${this.MAX_RETRIES} after ${delayTime}ms delay`,
                {
                  url: request.url,
                  method: request.method,
                  status: error.status,
                  statusText: error.statusText
                }
              );

              // Return timer to delay the retry
              return timer(delayTime);
            }

            // Don't retry, throw the error
            return throwError(() => error);
          })
        )
      ),
      catchError((error: HttpErrorResponse) => {
        // Handle the error based on status code
        this.handleErrorByStatusCode(error);

        // Log and format the error
        const formattedError = this.errorHandlerService.handleHttpError(error);

        // Return error observable
        return throwError(() => formattedError);
      })
    );
  }

  /**
   * Determine if the request should be retried
   */
  private shouldRetry(error: any, retryAttempt: number): boolean {
    // Don't retry if max attempts reached
    if (retryAttempt > this.MAX_RETRIES) {
      return false;
    }

    // Only retry for HttpErrorResponse
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    // Don't retry client errors (except specific ones)
    if (error.status >= 400 && error.status < 500) {
      return this.RETRYABLE_STATUS_CODES.includes(error.status);
    }

    // Retry server errors and network errors
    return error.status === 0 || error.status >= 500;
  }

  /**
   * Calculate exponential backoff delay
   * Formula: initialDelay * (2 ^ (attempt - 1))
   * Example: 1000ms, 2000ms, 4000ms
   */
  private calculateBackoffDelay(retryAttempt: number): number {
    return this.INITIAL_DELAY * Math.pow(2, retryAttempt - 1);
  }

  /**
   * Handle specific error status codes
   */
  private handleErrorByStatusCode(error: HttpErrorResponse): void {
    switch (error.status) {
      case 0:
        // Network error (offline or CORS)
        this.handleNetworkError(error);
        break;

      case 401:
        // Unauthorized - Session expired
        this.handleUnauthorizedError(error);
        break;

      case 403:
        // Forbidden - Access denied
        this.handleForbiddenError(error);
        break;

      case 404:
        // Not found
        this.handleNotFoundError(error);
        break;

      case 408:
        // Request timeout
        this.handleTimeoutError(error);
        break;

      case 429:
        // Too many requests
        this.handleTooManyRequestsError(error);
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors
        this.handleServerError(error);
        break;

      default:
        // Generic error
        this.handleGenericError(error);
        break;
    }
  }

  /**
   * Handle network errors (status 0)
   */
  private handleNetworkError(error: HttpErrorResponse): void {
    console.error('[Network Error] Unable to connect to server', {
      url: error.url,
      message: error.message
    });

    this.alertService.fire({
      icon: 'error',
      title: 'Network Error',
      text: 'Unable to connect to the server. Please check your internet connection and try again.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#d33',
      showCancelButton: true,
      cancelButtonText: 'Reload Page',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.dismiss === 'cancel') {
        window.location.reload();
      }
    });
  }

  /**
   * Handle 401 Unauthorized errors
   */
  private handleUnauthorizedError(error: HttpErrorResponse): void {
    console.error('[Authentication Error] Session expired or invalid token', {
      url: error.url,
      status: error.status
    });

    // Clear any stored authentication data
    removeStorage('token');
    removeStorage('user');
    try {
      sessionStorage.clear();
    } catch {
      // Blocked-storage browsers throw on access; there is nothing to clear.
    }

    // Show session expired message
    this.alertService.fire({
      icon: 'warning',
      title: 'Session Expired',
      text: 'Your session has expired. Please log in again to continue.',
      confirmButtonText: 'Go to Login',
      confirmButtonColor: '#3085d6',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then(() => {
      // Redirect to login page
      this.router.navigate(['/sign-in'], {
        queryParams: { returnUrl: this.router.url }
      });
    });
  }

  /**
   * Handle 403 Forbidden errors
   */
  private handleForbiddenError(error: HttpErrorResponse): void {
    console.error('[Authorization Error] Access denied', {
      url: error.url,
      status: error.status
    });

    this.toastService.error(
      'Access denied',
      'You do not have permission to perform this action. Contact your administrator if you believe this is an error.'
    );
  }

  /**
   * Handle 404 Not Found errors
   */
  private handleNotFoundError(error: HttpErrorResponse): void {
    console.error('[Not Found Error] Resource not found', {
      url: error.url,
      status: error.status
    });

    this.toastService.error(
      'Not found',
      'The requested resource could not be found. It may have been moved or deleted.'
    );
  }

  /**
   * Handle 408 Request Timeout errors
   */
  private handleTimeoutError(error: HttpErrorResponse): void {
    console.error('[Timeout Error] Request timeout', {
      url: error.url,
      status: error.status
    });

    // Already retried with backoff by the time we get here, so there is nothing
    // for the user to confirm — just tell them it did not land.
    this.toastService.warning(
      'Request timed out',
      'The request took too long to complete. Please try again.'
    );
  }

  /**
   * Handle 429 Too Many Requests errors
   */
  private handleTooManyRequestsError(error: HttpErrorResponse): void {
    console.error('[Rate Limit Error] Too many requests', {
      url: error.url,
      status: error.status
    });

    this.toastService.warning(
      'Too many requests',
      'You have made too many requests. Please wait a moment and try again.'
    );
  }

  /**
   * Handle 500+ Server errors
   */
  private handleServerError(error: HttpErrorResponse): void {
    console.error('[Server Error] Internal server error', {
      url: error.url,
      status: error.status,
      statusText: error.statusText,
      error: error.error
    });

    this.toastService.error(
      'Server error',
      `An internal server error occurred (${error.status}). Our team has been notified. Please try again later.`
    );
  }

  /**
   * Handle generic/unknown errors
   */
  private handleGenericError(error: HttpErrorResponse): void {
    console.error('[Generic Error] An error occurred', {
      url: error.url,
      status: error.status,
      statusText: error.statusText,
      error: error.error
    });

    // Don't show notification for handled errors
    // The ErrorHandlerService will handle the notification
  }
}
