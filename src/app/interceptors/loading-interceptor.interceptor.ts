import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { finalize, timeout, catchError } from 'rxjs/operators';
import { LoadingService } from '../service/loading.service';

@Injectable()
export class LoadingInterceptorInterceptor implements HttpInterceptor {
  private activeRequests = 0;
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds default timeout
  private readonly REQUEST_TIMEOUT_MAP = new Map<string, number>();

  constructor(private loadingService: LoadingService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Increment active requests counter
    this.incrementActiveRequests();

    // Show loading indicator
    this.showLoadingIfNeeded();

    // Determine timeout for this request
    const requestTimeout = this.getRequestTimeout(request);

    return next.handle(request).pipe(
      // Add timeout to prevent indefinite loading
      timeout(requestTimeout),

      // Catch errors including timeout errors
      catchError((error: any) => {
        // Handle timeout errors
        if (error instanceof TimeoutError) {
          console.error(`Request timeout after ${requestTimeout}ms:`, {
            method: request.method,
            url: request.url,
            timeout: requestTimeout
          });

          // Create a custom error response for timeout
          const timeoutError = new HttpErrorResponse({
            error: 'Request timeout',
            status: 408,
            statusText: 'Request Timeout',
            url: request.url
          });

          return throwError(() => timeoutError);
        }

        // Handle other HTTP errors
        if (error instanceof HttpErrorResponse) {
          console.error('HTTP Error in loading interceptor:', {
            status: error.status,
            message: error.message,
            url: request.url
          });
        }

        // Re-throw the error for other interceptors/components to handle
        return throwError(() => error);
      }),

      // Always decrement counter and hide loading when done
      finalize(() => {
        this.decrementActiveRequests();
        this.hideLoadingIfNeeded();
      })
    );
  }

  /**
   * Increments the active requests counter safely
   */
  private incrementActiveRequests(): void {
    try {
      this.activeRequests++;
    } catch (error) {
      console.error('Error incrementing active requests:', error);
      // Reset to 1 if there's an error
      this.activeRequests = 1;
    }
  }

  /**
   * Decrements the active requests counter safely
   */
  private decrementActiveRequests(): void {
    try {
      this.activeRequests--;

      // Ensure counter doesn't go negative
      if (this.activeRequests < 0) {
        console.warn('Active requests counter went negative, resetting to 0');
        this.activeRequests = 0;
      }
    } catch (error) {
      console.error('Error decrementing active requests:', error);
      // Reset to 0 if there's an error
      this.activeRequests = 0;
    }
  }

  /**
   * Shows loading indicator if this is the first request
   */
  private showLoadingIfNeeded(): void {
    try {
      if (this.activeRequests === 1) {
        this.loadingService.show();
      }
    } catch (error) {
      console.error('Error showing loading indicator:', error);
    }
  }

  /**
   * Hides loading indicator if there are no more active requests
   */
  private hideLoadingIfNeeded(): void {
    try {
      if (this.activeRequests === 0) {
        this.loadingService.hide();
      }
    } catch (error) {
      console.error('Error hiding loading indicator:', error);
      // Force hide loading in case of error
      try {
        this.loadingService.hide();
      } catch (e) {
        console.error('Failed to force hide loading indicator:', e);
      }
    }
  }

  /**
   * Gets the timeout for a specific request
   * Can be customized based on the request URL or method
   */
  private getRequestTimeout(request: HttpRequest<unknown>): number {
    try {
      // Check if a specific timeout is configured for this URL
      for (const [urlPattern, timeoutValue] of this.REQUEST_TIMEOUT_MAP.entries()) {
        if (request.url.includes(urlPattern)) {
          return timeoutValue;
        }
      }

      // Check for custom timeout header
      const customTimeout = request.headers.get('X-Request-Timeout');
      if (customTimeout) {
        const parsedTimeout = parseInt(customTimeout, 10);
        if (!isNaN(parsedTimeout) && parsedTimeout > 0) {
          return parsedTimeout;
        }
      }

      // Use longer timeout for upload/download requests
      if (request.method === 'POST' || request.method === 'PUT') {
        return this.DEFAULT_TIMEOUT * 2; // 60 seconds for uploads
      }

      // Default timeout
      return this.DEFAULT_TIMEOUT;
    } catch (error) {
      console.error('Error getting request timeout:', error);
      return this.DEFAULT_TIMEOUT;
    }
  }

  /**
   * Configures custom timeout for specific URL patterns
   * This can be called from app initialization or configuration
   */
  public setTimeoutForUrl(urlPattern: string, timeoutMs: number): void {
    try {
      if (urlPattern && timeoutMs > 0) {
        this.REQUEST_TIMEOUT_MAP.set(urlPattern, timeoutMs);
      }
    } catch (error) {
      console.error('Error setting timeout for URL:', error);
    }
  }

  /**
   * Gets the current number of active requests
   * Useful for debugging
   */
  public getActiveRequestsCount(): number {
    return this.activeRequests;
  }

  /**
   * Resets the active requests counter
   * Should only be used in error recovery scenarios
   */
  public resetActiveRequests(): void {
    try {
      console.warn('Resetting active requests counter');
      this.activeRequests = 0;
      this.loadingService.hide();
    } catch (error) {
      console.error('Error resetting active requests:', error);
    }
  }
}
