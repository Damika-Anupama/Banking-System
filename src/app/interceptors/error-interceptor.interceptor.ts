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
import Swal from 'sweetalert2';
import { ErrorHandlerService } from '../service/error-handler.service';

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
    private errorHandlerService: ErrorHandlerService
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

    Swal.fire({
      icon: 'error',
      title: 'Network Error',
      text: 'Unable to connect to the server. Please check your internet connection and try again.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#d33',
      showCancelButton: true,
      cancelButtonText: 'Reload Page',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();

    // Show session expired message
    Swal.fire({
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

    Swal.fire({
      icon: 'error',
      title: 'Access Denied',
      text: 'You do not have permission to perform this action. Please contact your administrator if you believe this is an error.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#d33'
    });
  }

  /**
   * Handle 404 Not Found errors
   */
  private handleNotFoundError(error: HttpErrorResponse): void {
    console.error('[Not Found Error] Resource not found', {
      url: error.url,
      status: error.status
    });

    Swal.fire({
      icon: 'error',
      title: 'Resource Not Found',
      text: 'The requested resource could not be found. It may have been moved or deleted.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#d33'
    });
  }

  /**
   * Handle 408 Request Timeout errors
   */
  private handleTimeoutError(error: HttpErrorResponse): void {
    console.error('[Timeout Error] Request timeout', {
      url: error.url,
      status: error.status
    });

    Swal.fire({
      icon: 'warning',
      title: 'Request Timeout',
      text: 'The request took too long to complete. Please try again.',
      confirmButtonText: 'Retry',
      confirmButtonColor: '#3085d6',
      showCancelButton: true,
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.reload();
      }
    });
  }

  /**
   * Handle 429 Too Many Requests errors
   */
  private handleTooManyRequestsError(error: HttpErrorResponse): void {
    console.error('[Rate Limit Error] Too many requests', {
      url: error.url,
      status: error.status
    });

    Swal.fire({
      icon: 'warning',
      title: 'Too Many Requests',
      text: 'You have made too many requests. Please wait a moment and try again.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#f39c12',
      timer: 5000,
      timerProgressBar: true
    });
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

    Swal.fire({
      icon: 'error',
      title: 'Server Error',
      text: 'An internal server error occurred. Our team has been notified. Please try again later.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#d33',
      footer: `<small>Error Code: ${error.status}</small>`
    });
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
