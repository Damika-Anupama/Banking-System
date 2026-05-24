/**
 * Unit Tests for ErrorHandlerService
 *
 * Tests error classification, logging, message formatting, and user notifications
 * Target coverage: 90%+
 */

import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandlerService } from './error-handler.service';
import { ErrorSeverity, ErrorType } from '../model/error-response.model';
import Swal from 'sweetalert2';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ErrorHandlerService]
    });

    service = TestBed.inject(ErrorHandlerService);

    // Spy on Swal to prevent actual alerts during tests
    spyOn(Swal, 'fire');
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('handleHttpError()', () => {
    it('should handle 400 Bad Request error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Invalid input' },
        status: 400,
        statusText: 'Bad Request',
        url: '/api/v1/test'
      });

      spyOn(console, 'group');
      spyOn(console, 'error');

      const result = service.handleHttpError(httpError);

      expect(result.status).toBe(400);
      expect(result.statusText).toBe('Bad Request');
      expect(result.message).toBe('Invalid input');
      expect(result.path).toBe('/api/v1/test');
      expect(console.group).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle 401 Unauthorized error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Unauthorized' },
        status: 401,
        statusText: 'Unauthorized',
        url: '/api/v1/user/profile'
      });

      spyOn(console, 'group');

      const result = service.handleHttpError(httpError);

      expect(result.status).toBe(401);
      expect(result.message).toBe('Unauthorized');
      // Should NOT call Swal.fire for 401 (handled by interceptor)
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should handle 403 Forbidden error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Forbidden' },
        status: 403,
        statusText: 'Forbidden',
        url: '/api/v1/admin'
      });

      spyOn(console, 'group');

      const result = service.handleHttpError(httpError);

      expect(result.status).toBe(403);
      expect(result.message).toBe('Forbidden');
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          text: 'You do not have permission to perform this action.'
        })
      );
    });

    it('should handle 404 Not Found error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Resource not found' },
        status: 404,
        statusText: 'Not Found',
        url: '/api/v1/user/999'
      });

      spyOn(console, 'group');

      const result = service.handleHttpError(httpError);

      expect(result.status).toBe(404);
      expect(result.message).toBe('Resource not found');
      expect(Swal.fire).toHaveBeenCalled();
    });

    it('should handle 408 Request Timeout error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Request timeout' },
        status: 408,
        statusText: 'Request Timeout'
      });

      const result = service.handleHttpError(httpError);

      expect(result.status).toBe(408);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          text: 'The request took too long. Please try again.'
        })
      );
    });

    it('should handle 409 Conflict error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Email already exists' },
        status: 409,
        statusText: 'Conflict'
      });

      const result = service.handleHttpError(httpError);

      expect(result.status).toBe(409);
      expect(result.message).toBe('Email already exists');
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          text: 'There was a conflict with the current state. Please refresh and try again.'
        })
      );
    });

    it('should handle 422 Unprocessable Entity error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Validation failed' },
        status: 422,
        statusText: 'Unprocessable Entity'
      });

      const result = service.handleHttpError(httpError);

      expect(result.status).toBe(422);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          text: 'The data provided could not be processed. Please check your input.'
        })
      );
    });

    it('should handle 429 Too Many Requests error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Rate limit exceeded' },
        status: 429,
        statusText: 'Too Many Requests'
      });

      const result = service.handleHttpError(httpError);

      expect(result.status).toBe(429);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          text: 'Too many requests. Please wait a moment and try again.'
        })
      );
    });

    it('should handle 500 Internal Server Error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Internal server error' },
        status: 500,
        statusText: 'Internal Server Error'
      });

      spyOn(console, 'group');

      const result = service.handleHttpError(httpError);

      expect(result.status).toBe(500);
      expect(result.message).toBe('Internal server error');
      expect(Swal.fire).toHaveBeenCalled();
    });

    it('should handle 502 Bad Gateway error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Bad Gateway' },
        status: 502,
        statusText: 'Bad Gateway'
      });

      const result = service.handleHttpError(httpError);

      expect(result.status).toBe(502);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          text: 'Bad gateway. The server is temporarily unavailable.'
        })
      );
    });

    it('should handle 503 Service Unavailable error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Service Unavailable' },
        status: 503,
        statusText: 'Service Unavailable'
      });

      const result = service.handleHttpError(httpError);

      expect(result.status).toBe(503);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          text: 'The service is temporarily unavailable. Please try again later.'
        })
      );
    });

    it('should handle 504 Gateway Timeout error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Gateway Timeout' },
        status: 504,
        statusText: 'Gateway Timeout'
      });

      const result = service.handleHttpError(httpError);

      expect(result.status).toBe(504);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          text: 'Gateway timeout. The server took too long to respond.'
        })
      );
    });

    it('should handle network error (status 0)', () => {
      const httpError = new HttpErrorResponse({
        error: null,
        status: 0,
        statusText: 'Unknown Error'
      });

      spyOn(console, 'group');

      const result = service.handleHttpError(httpError);

      expect(result.status).toBe(0);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          text: 'Unable to connect to the server. Please check your internet connection.'
        })
      );
    });

    it('should handle error with string error body', () => {
      const httpError = new HttpErrorResponse({
        error: 'Simple error message',
        status: 400,
        statusText: 'Bad Request'
      });

      const result = service.handleHttpError(httpError);

      expect(result.message).toBe('Simple error message');
    });

    it('should handle error with error field in response', () => {
      const httpError = new HttpErrorResponse({
        error: { error: 'Detailed error message' },
        status: 400,
        statusText: 'Bad Request'
      });

      const result = service.handleHttpError(httpError);

      expect(result.message).toBe('Detailed error message');
    });

    it('should handle error with details field', () => {
      const httpError = new HttpErrorResponse({
        error: { details: 'Detailed information' },
        status: 400,
        statusText: 'Bad Request'
      });

      const result = service.handleHttpError(httpError);

      expect(result.message).toBe('Detailed information');
    });

    it('should handle error with errors array', () => {
      const httpError = new HttpErrorResponse({
        error: { errors: ['Error 1', 'Error 2', 'Error 3'] },
        status: 400,
        statusText: 'Bad Request'
      });

      const result = service.handleHttpError(httpError);

      expect(result.message).toBe('Error 1, Error 2, Error 3');
    });

    it('should handle error with object in error field', () => {
      const httpError = new HttpErrorResponse({
        error: { error: { field: 'value' } },
        status: 400,
        statusText: 'Bad Request'
      });

      const result = service.handleHttpError(httpError);

      expect(result.message).toContain('field');
      expect(result.message).toContain('value');
    });

    it('should handle error without error body', () => {
      const httpError = new HttpErrorResponse({
        error: null,
        status: 500,
        statusText: 'Internal Server Error',
        url: '/api/v1/test'
      });

      const result = service.handleHttpError(httpError);

      expect(result.message).toBeTruthy();
    });

    it('should handle error with unknown path', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Error' },
        status: 500,
        statusText: 'Error',
        url: undefined
      });

      const result = service.handleHttpError(httpError);

      expect(result.path).toBe('Unknown path');
    });

    it('should include timestamp in error response', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Error' },
        status: 500,
        statusText: 'Error'
      });

      const result = service.handleHttpError(httpError);

      expect(result.timestamp).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should return fallback message when error body is empty object', () => {
      const httpError = new HttpErrorResponse({
        error: {},
        status: 500,
        statusText: 'Error'
      });

      const result = service.handleHttpError(httpError);

      // When error body is empty object, it falls through to error.message
      // HttpErrorResponse generates a default message
      expect(result.message).toBeTruthy();
      expect(typeof result.message).toBe('string');
    });

    it('should use error.message when no error body and error.message exists', () => {
      // Create a custom HttpErrorResponse with message property
      const httpError = new HttpErrorResponse({
        error: null,
        status: 500,
        statusText: 'Error'
      });

      // The HttpErrorResponse internally creates a message, so we just verify it's used
      const result = service.handleHttpError(httpError);

      expect(result.message).toBeTruthy();
      expect(typeof result.message).toBe('string');
    });
  });

  describe('handleError()', () => {
    it('should handle generic Error object', () => {
      const error = new Error('Something went wrong');

      spyOn(console, 'group');
      spyOn(console, 'error');

      service.handleError(error);

      expect(console.group).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Message:', 'Something went wrong');
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          text: 'An unexpected error occurred. Please try again.'
        })
      );
    });

    it('should include stack trace in error log', () => {
      const error = new Error('Error with stack');
      error.stack = 'Stack trace here';

      spyOn(console, 'group');
      spyOn(console, 'error');

      service.handleError(error);

      expect(console.error).toHaveBeenCalledWith('Stack Trace:', 'Stack trace here');
    });

    it('should handle error without stack trace', () => {
      const error = new Error('Error without stack');
      error.stack = undefined;

      spyOn(console, 'group');
      spyOn(console, 'error');

      service.handleError(error);

      expect(console.error).toHaveBeenCalledWith('Message:', 'Error without stack');
    });
  });

  describe('showErrorMessage()', () => {
    it('should display error message with default title', () => {
      service.showErrorMessage('Test error message');

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Test error message',
          confirmButtonText: 'OK'
        })
      );
    });

    it('should display error message with custom title', () => {
      service.showErrorMessage('Test error', 'Custom Error');

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Custom Error',
          text: 'Test error'
        })
      );
    });

    it('should have correct button color for error', () => {
      service.showErrorMessage('Error');

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          confirmButtonColor: '#d33'
        })
      );
    });
  });

  describe('showSuccessMessage()', () => {
    it('should display success message with default title', () => {
      service.showSuccessMessage('Operation successful');

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'success',
          title: 'Success',
          text: 'Operation successful',
          timer: 3000
        })
      );
    });

    it('should display success message with custom title', () => {
      service.showSuccessMessage('Saved', 'Data Saved');

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'success',
          title: 'Data Saved',
          text: 'Saved'
        })
      );
    });

    it('should have timer progress bar', () => {
      service.showSuccessMessage('Success');

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          timerProgressBar: true
        })
      );
    });
  });

  describe('showWarningMessage()', () => {
    it('should display warning message with default title', () => {
      service.showWarningMessage('This is a warning');

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'warning',
          title: 'Warning',
          text: 'This is a warning'
        })
      );
    });

    it('should display warning message with custom title', () => {
      service.showWarningMessage('Be careful', 'Caution');

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'warning',
          title: 'Caution',
          text: 'Be careful'
        })
      );
    });

    it('should have correct button color for warning', () => {
      service.showWarningMessage('Warning');

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          confirmButtonColor: '#f39c12'
        })
      );
    });
  });

  describe('showInfoMessage()', () => {
    it('should display info message with default title', () => {
      service.showInfoMessage('Information message');

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'info',
          title: 'Information',
          text: 'Information message'
        })
      );
    });

    it('should display info message with custom title', () => {
      service.showInfoMessage('Details', 'More Info');

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'info',
          title: 'More Info',
          text: 'Details'
        })
      );
    });
  });

  describe('Error Type Classification', () => {
    it('should classify status 0 as NETWORK error', () => {
      const httpError = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });

      spyOn(console, 'group');
      spyOn(console, 'error');

      service.handleHttpError(httpError);

      expect(console.group).toHaveBeenCalledWith(
        jasmine.stringContaining('[NETWORK]'),
        jasmine.any(String)
      );
    });

    it('should classify status 401 as AUTHENTICATION error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Unauthorized' },
        status: 401,
        statusText: 'Unauthorized'
      });

      spyOn(console, 'group');

      service.handleHttpError(httpError);

      expect(console.group).toHaveBeenCalledWith(
        jasmine.stringContaining('[AUTHENTICATION]'),
        jasmine.any(String)
      );
    });

    it('should classify status 403 as AUTHORIZATION error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Forbidden' },
        status: 403,
        statusText: 'Forbidden'
      });

      spyOn(console, 'group');

      service.handleHttpError(httpError);

      expect(console.group).toHaveBeenCalledWith(
        jasmine.stringContaining('[AUTHORIZATION]'),
        jasmine.any(String)
      );
    });

    it('should classify status 422 as VALIDATION error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Validation failed' },
        status: 422,
        statusText: 'Unprocessable Entity'
      });

      spyOn(console, 'group');

      service.handleHttpError(httpError);

      expect(console.group).toHaveBeenCalledWith(
        jasmine.stringContaining('[VALIDATION]'),
        jasmine.any(String)
      );
    });

    it('should classify status 500 as SERVER error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Server error' },
        status: 500,
        statusText: 'Internal Server Error'
      });

      spyOn(console, 'group');

      service.handleHttpError(httpError);

      expect(console.group).toHaveBeenCalledWith(
        jasmine.stringContaining('[SERVER]'),
        jasmine.any(String)
      );
    });

    it('should classify status 400 as CLIENT error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Bad request' },
        status: 400,
        statusText: 'Bad Request'
      });

      spyOn(console, 'group');

      service.handleHttpError(httpError);

      expect(console.group).toHaveBeenCalledWith(
        jasmine.stringContaining('[CLIENT]'),
        jasmine.any(String)
      );
    });

    it('should classify status 200 as UNKNOWN error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Unexpected 2xx error' },
        status: 200,
        statusText: 'OK'
      });

      spyOn(console, 'group');

      service.handleHttpError(httpError);

      expect(console.group).toHaveBeenCalledWith(
        jasmine.stringContaining('[UNKNOWN]'),
        jasmine.any(String)
      );
    });

    it('should classify status 300 as UNKNOWN error', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Unexpected 3xx error' },
        status: 302,
        statusText: 'Found'
      });

      spyOn(console, 'group');

      service.handleHttpError(httpError);

      expect(console.group).toHaveBeenCalledWith(
        jasmine.stringContaining('[UNKNOWN]'),
        jasmine.any(String)
      );
    });
  });

  describe('Error Severity Classification', () => {
    it('should classify status 0 as CRITICAL', () => {
      const httpError = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });

      spyOn(console, 'group');

      service.handleHttpError(httpError);

      expect(console.group).toHaveBeenCalledWith(
        jasmine.stringContaining('CRITICAL'),
        jasmine.any(String)
      );
    });

    it('should classify status 500 as CRITICAL', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Server error' },
        status: 500,
        statusText: 'Internal Server Error'
      });

      spyOn(console, 'group');

      service.handleHttpError(httpError);

      expect(console.group).toHaveBeenCalledWith(
        jasmine.stringContaining('CRITICAL'),
        jasmine.any(String)
      );
    });

    it('should classify status 401 as HIGH', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Unauthorized' },
        status: 401,
        statusText: 'Unauthorized'
      });

      spyOn(console, 'group');

      service.handleHttpError(httpError);

      expect(console.group).toHaveBeenCalledWith(
        jasmine.stringContaining('HIGH'),
        jasmine.any(String)
      );
    });

    it('should classify status 403 as HIGH', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Forbidden' },
        status: 403,
        statusText: 'Forbidden'
      });

      spyOn(console, 'group');

      service.handleHttpError(httpError);

      expect(console.group).toHaveBeenCalledWith(
        jasmine.stringContaining('HIGH'),
        jasmine.any(String)
      );
    });

    it('should classify status 400 as MEDIUM', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Bad request' },
        status: 400,
        statusText: 'Bad Request'
      });

      spyOn(console, 'group');

      service.handleHttpError(httpError);

      expect(console.group).toHaveBeenCalledWith(
        jasmine.stringContaining('MEDIUM'),
        jasmine.any(String)
      );
    });

    it('should classify status 200 as LOW severity', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Unexpected 2xx error' },
        status: 200,
        statusText: 'OK'
      });

      spyOn(console, 'group');

      service.handleHttpError(httpError);

      expect(console.group).toHaveBeenCalledWith(
        jasmine.stringContaining('LOW'),
        jasmine.any(String)
      );
    });

    it('should classify status 300 as LOW severity', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Unexpected 3xx error' },
        status: 302,
        statusText: 'Found'
      });

      spyOn(console, 'group');

      service.handleHttpError(httpError);

      expect(console.group).toHaveBeenCalledWith(
        jasmine.stringContaining('LOW'),
        jasmine.any(String)
      );
    });
  });

  describe('Console Logging', () => {
    it('should log with status code', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Error' },
        status: 500,
        statusText: 'Error'
      });

      spyOn(console, 'group');
      spyOn(console, 'error');
      spyOn(console, 'groupEnd');

      service.handleHttpError(httpError);

      expect(console.error).toHaveBeenCalledWith('Status Code:', 500);
      expect(console.groupEnd).toHaveBeenCalled();
    });

    it('should log with URL', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Error' },
        status: 500,
        statusText: 'Error',
        url: '/api/v1/test'
      });

      spyOn(console, 'error');

      service.handleHttpError(httpError);

      expect(console.error).toHaveBeenCalledWith('URL:', '/api/v1/test');
    });

    it('should log technical details', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'Error', details: 'Tech details' },
        status: 500,
        statusText: 'Error'
      });

      spyOn(console, 'error');

      service.handleHttpError(httpError);

      expect(console.error).toHaveBeenCalledWith('Technical Details:', jasmine.any(Object));
    });
  });
});
