import { Injectable } from '@angular/core';
import { finalize, tap, catchError } from 'rxjs/operators';
import { MessageService } from '../service/message.service';
import { HttpHandler, HttpRequest, HttpResponse, HttpErrorResponse, HttpEvent } from "@angular/common/http";
import { Observable, throwError } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class LoggingInterceptorService {
  constructor(protected messenger: MessageService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const started = Date.now();
    let status: string = 'unknown';
    let statusCode: number | undefined;
    let errorDetails: string | undefined;

    // Create structured log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.urlWithParams,
      requestHeaders: this.sanitizeHeaders(req.headers),
    };

    console.log('HTTP Request:', {
      ...logEntry,
      body: this.sanitizeBody(req.body)
    });

    // Extend server response observable with logging
    return next.handle(req)
      .pipe(
        tap({
          next: (event) => {
            // Succeeds when there is a response; ignore other events
            if (event instanceof HttpResponse) {
              status = 'succeeded';
              statusCode = event.status;

              // Log successful response with details
              console.log('HTTP Response Success:', {
                ...logEntry,
                status: statusCode,
                statusText: event.statusText,
                responseHeaders: this.sanitizeHeaders(event.headers),
                bodySize: event.body ? JSON.stringify(event.body).length : 0
              });
            }
          },
          error: (error: HttpErrorResponse) => {
            // Operation failed; error is an HttpErrorResponse
            status = 'failed';
            statusCode = error.status;
            errorDetails = this.getErrorDetails(error);

            // Log error with comprehensive details
            console.error('HTTP Response Error:', {
              ...logEntry,
              status: statusCode,
              statusText: error.statusText,
              errorMessage: error.message,
              errorDetails,
              errorName: error.name,
              errorUrl: error.url,
              responseHeaders: error.headers ? this.sanitizeHeaders(error.headers) : undefined,
              errorBody: error.error
            });

            // Add error notification to messenger
            const errorMsg = this.formatErrorMessage(req, error, errorDetails);
            this.messenger.add(errorMsg);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          // Ensure error is properly logged even if tap fails
          if (status === 'unknown') {
            status = 'failed';
            statusCode = error.status;
            errorDetails = this.getErrorDetails(error);

            console.error('HTTP Error (catchError):', {
              ...logEntry,
              error: error.message,
              status: statusCode
            });
          }
          return throwError(() => error);
        }),
        // Log when response observable either completes or errors
        finalize(() => {
          const elapsed = Date.now() - started;

          // Create structured log message
          const logMessage = this.formatLogMessage(req, status, statusCode, elapsed, errorDetails);

          // Add to messenger service
          try {
            this.messenger.add(logMessage);
          } catch (error) {
            console.error('Error adding message to messenger service:', error);
          }

          // Console log with structured format
          const finalLog = {
            ...logEntry,
            status,
            statusCode,
            elapsed: `${elapsed}ms`,
            errorDetails
          };

          if (status === 'failed') {
            console.error('HTTP Request Completed (Failed):', finalLog);
          } else {
            console.log('HTTP Request Completed (Success):', finalLog);
          }
        })
      );
  }

  /**
   * Formats a comprehensive log message
   */
  private formatLogMessage(
    req: HttpRequest<any>,
    status: string,
    statusCode: number | undefined,
    elapsed: number,
    errorDetails?: string
  ): string {
    const statusInfo = statusCode ? `[${statusCode}]` : '';
    const baseMsg = `${req.method} "${req.urlWithParams}" ${statusInfo} ${status} in ${elapsed}ms`;

    if (errorDetails && status === 'failed') {
      return `${baseMsg} - ${errorDetails}`;
    }

    return baseMsg;
  }

  /**
   * Formats error message with details
   */
  private formatErrorMessage(
    req: HttpRequest<any>,
    error: HttpErrorResponse,
    errorDetails: string
  ): string {
    return `ERROR: ${req.method} ${req.url} failed with status ${error.status} - ${errorDetails}`;
  }

  /**
   * Extracts detailed error information
   */
  private getErrorDetails(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Network error or CORS issue - Unable to connect to server';
    }

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      return `Client Error: ${error.error.message}`;
    }

    // Server-side error
    let details = error.message;

    if (error.error) {
      if (typeof error.error === 'string') {
        details = error.error;
      } else if (error.error.message) {
        details = error.error.message;
      } else if (error.error.error) {
        details = error.error.error;
      }
    }

    return details;
  }

  /**
   * Sanitizes headers by removing sensitive information
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized: any = {};
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    if (headers && headers.keys) {
      headers.keys().forEach((key: string) => {
        const lowerKey = key.toLowerCase();
        if (sensitiveHeaders.includes(lowerKey)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = headers.get(key);
        }
      });
    }

    return sanitized;
  }

  /**
   * Sanitizes request body by removing sensitive information
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;

    try {
      const sanitized = { ...body };
      const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'creditCard'];

      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      });

      return sanitized;
    } catch (error) {
      return '[Unable to sanitize body]';
    }
  }
}