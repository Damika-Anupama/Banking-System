import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import {
  ErrorResponse,
  BackendErrorResponse,
  ErrorSeverity,
  ErrorType,
  ErrorLog
} from '../model/error-response.model';

/**
 * Global Error Handler Service
 *
 * Centralized service for handling all application errors.
 * Provides consistent error logging, formatting, and user notifications.
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor() { }

  /**
   * Main HTTP error handler
   * @param error HttpErrorResponse from interceptor or service
   * @returns Formatted ErrorResponse object
   */
  handleHttpError(error: HttpErrorResponse): ErrorResponse {
    const errorResponse: ErrorResponse = {
      status: error.status,
      statusText: error.statusText,
      message: this.extractErrorMessage(error),
      error: error.error,
      timestamp: new Date(),
      path: error.url || 'Unknown path'
    };

    // Determine error type and severity
    const errorType = this.determineErrorType(error.status);
    const severity = this.determineErrorSeverity(error.status);

    // Log the error
    this.logError({
      type: errorType,
      severity: severity,
      message: errorResponse.message,
      timestamp: errorResponse.timestamp || new Date(),
      userMessage: this.getUserFriendlyMessage(error.status),
      technicalDetails: {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        error: error.error
      },
      url: error.url || undefined,
      statusCode: error.status
    });

    // Show user notification
    this.showErrorNotification(error.status, errorResponse.message);

    return errorResponse;
  }

  /**
   * Generic error handler for non-HTTP errors
   * @param error Any Error object
   */
  handleError(error: Error): void {
    const errorLog: ErrorLog = {
      type: ErrorType.CLIENT,
      severity: ErrorSeverity.HIGH,
      message: error.message,
      timestamp: new Date(),
      userMessage: 'An unexpected error occurred',
      technicalDetails: error,
      stackTrace: error.stack
    };

    this.logError(errorLog);
    this.showErrorMessage('An unexpected error occurred. Please try again.');
  }

  /**
   * Display user-friendly error message using SweetAlert2
   * @param message Custom error message
   * @param title Optional title (defaults to 'Error')
   */
  showErrorMessage(message: string, title: string = 'Error'): void {
    Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      confirmButtonText: 'OK',
      confirmButtonColor: '#d33',
      backdrop: true,
      allowOutsideClick: true,
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });
  }

  /**
   * Display success message using SweetAlert2
   * @param message Success message
   * @param title Optional title (defaults to 'Success')
   */
  showSuccessMessage(message: string, title: string = 'Success'): void {
    Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      confirmButtonText: 'OK',
      confirmButtonColor: '#3085d6',
      timer: 3000,
      timerProgressBar: true
    });
  }

  /**
   * Display warning message using SweetAlert2
   * @param message Warning message
   * @param title Optional title (defaults to 'Warning')
   */
  showWarningMessage(message: string, title: string = 'Warning'): void {
    Swal.fire({
      icon: 'warning',
      title: title,
      text: message,
      confirmButtonText: 'OK',
      confirmButtonColor: '#f39c12'
    });
  }

  /**
   * Display information message using SweetAlert2
   * @param message Info message
   * @param title Optional title (defaults to 'Information')
   */
  showInfoMessage(message: string, title: string = 'Information'): void {
    Swal.fire({
      icon: 'info',
      title: title,
      text: message,
      confirmButtonText: 'OK',
      confirmButtonColor: '#3085d6'
    });
  }

  /**
   * Log error to console with formatted output
   * @param error ErrorLog object
   */
  logError(error: ErrorLog): void {
    const logStyle = this.getLogStyle(error.severity);

    console.group(`%c[${error.type}] ${error.severity.toUpperCase()} - ${error.timestamp.toISOString()}`, logStyle);
    console.error('Message:', error.message);
    console.error('User Message:', error.userMessage);

    if (error.statusCode) {
      console.error('Status Code:', error.statusCode);
    }

    if (error.url) {
      console.error('URL:', error.url);
    }

    if (error.technicalDetails) {
      console.error('Technical Details:', error.technicalDetails);
    }

    if (error.stackTrace) {
      console.error('Stack Trace:', error.stackTrace);
    }

    console.groupEnd();
  }

  /**
   * Extract error message from HttpErrorResponse
   * Handles various backend error response formats
   */
  private extractErrorMessage(error: HttpErrorResponse): string {
    if (!error.error) {
      return error.message || 'An unknown error occurred';
    }

    const backendError = error.error as BackendErrorResponse;

    // Check various possible error message locations
    if (typeof error.error === 'string') {
      return error.error;
    }

    if (backendError.message) {
      return backendError.message;
    }

    if (backendError.error) {
      return typeof backendError.error === 'string'
        ? backendError.error
        : JSON.stringify(backendError.error);
    }

    if (backendError.details) {
      return backendError.details;
    }

    if (backendError.errors && Array.isArray(backendError.errors)) {
      return backendError.errors.join(', ');
    }

    return error.message || 'An unknown error occurred';
  }

  /**
   * Get user-friendly message based on HTTP status code
   */
  private getUserFriendlyMessage(status: number): string {
    const messages: { [key: number]: string } = {
      0: 'Unable to connect to the server. Please check your internet connection.',
      400: 'The request was invalid. Please check your input and try again.',
      401: 'Your session has expired. Please log in again.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource could not be found.',
      408: 'The request took too long. Please try again.',
      409: 'There was a conflict with the current state. Please refresh and try again.',
      422: 'The data provided could not be processed. Please check your input.',
      429: 'Too many requests. Please wait a moment and try again.',
      500: 'An internal server error occurred. Please try again later.',
      502: 'Bad gateway. The server is temporarily unavailable.',
      503: 'The service is temporarily unavailable. Please try again later.',
      504: 'Gateway timeout. The server took too long to respond.'
    };

    return messages[status] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Show error notification based on status code
   */
  private showErrorNotification(status: number, message: string): void {
    const userMessage = this.getUserFriendlyMessage(status);

    // Don't show notification for certain status codes that redirect
    if (status === 401) {
      // Session expired handled by interceptor redirect
      return;
    }

    this.showErrorMessage(userMessage);
  }

  /**
   * Determine error type based on HTTP status code
   */
  private determineErrorType(status: number): ErrorType {
    if (status === 0) return ErrorType.NETWORK;
    if (status === 401) return ErrorType.AUTHENTICATION;
    if (status === 403) return ErrorType.AUTHORIZATION;
    if (status === 422) return ErrorType.VALIDATION;
    if (status >= 500) return ErrorType.SERVER;
    if (status >= 400) return ErrorType.CLIENT;
    return ErrorType.UNKNOWN;
  }

  /**
   * Determine error severity based on HTTP status code
   */
  private determineErrorSeverity(status: number): ErrorSeverity {
    if (status === 0 || status >= 500) return ErrorSeverity.CRITICAL;
    if (status === 401 || status === 403) return ErrorSeverity.HIGH;
    if (status >= 400) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  /**
   * Get console log styling based on severity
   */
  private getLogStyle(severity: ErrorSeverity): string {
    const styles: { [key in ErrorSeverity]: string } = {
      [ErrorSeverity.LOW]: 'color: #3498db; font-weight: bold;',
      [ErrorSeverity.MEDIUM]: 'color: #f39c12; font-weight: bold;',
      [ErrorSeverity.HIGH]: 'color: #e67e22; font-weight: bold;',
      [ErrorSeverity.CRITICAL]: 'color: #e74c3c; font-weight: bold; font-size: 14px;'
    };

    return styles[severity];
  }
}
