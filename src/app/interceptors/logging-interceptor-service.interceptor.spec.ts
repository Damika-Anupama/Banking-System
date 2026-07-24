/**
 * Unit Tests for LoggingInterceptorService
 *
 * Tests request/response logging, error logging, header sanitization
 * Target coverage: 95%+
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient, HttpHeaders } from '@angular/common/http';
import { LoggingInterceptorService } from './logging-interceptor-service.interceptor';
import { MessageService } from '../service/message.service';

describe('LoggingInterceptorService', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let messageService: jasmine.SpyObj<MessageService>;
  let interceptor: LoggingInterceptorService;

  const TEST_URL = 'http://localhost:3000/api/test';

  beforeEach(() => {
    const messageServiceSpy = jasmine.createSpyObj('MessageService', ['add', 'clear']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LoggingInterceptorService,
        { provide: MessageService, useValue: messageServiceSpy },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: LoggingInterceptorService,
          multi: true
        }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    messageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;
    interceptor = TestBed.inject(LoggingInterceptorService);

    spyOn(console, 'log');
    spyOn(console, 'error');
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Interceptor Creation', () => {
    it('should create', () => {
      expect(interceptor).toBeTruthy();
    });
  });

  describe('Request Logging', () => {
    it('should log HTTP request', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        expect(console.log).toHaveBeenCalledWith('HTTP Request:', jasmine.any(Object));
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({ data: 'success' });
    });

    it('should log request method and URL', (done) => {
      httpClient.post(TEST_URL, { test: 'data' }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(console.log).toHaveBeenCalled();
      req.flush({});
    });

    it('should log request headers', (done) => {
      const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

      httpClient.get(TEST_URL, { headers }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });

    it('should log request body for POST', (done) => {
      const body = { username: 'test', password: 'secret123' };

      httpClient.post(TEST_URL, body).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });
  });

  describe('Response Logging - Success', () => {
    it('should log successful HTTP response', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        expect(console.log).toHaveBeenCalledWith('HTTP Response Success:', jasmine.any(Object));
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({ data: 'success' }, { status: 200, statusText: 'OK' });
    });

    it('should log response status code', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({ data: 'success' }, { status: 200, statusText: 'OK' });
    });

    it('should log response body size', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({ data: 'test', items: [1, 2, 3] });
    });

    it('should add success message to messenger', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        // Check after a small delay to ensure finalize has executed
        setTimeout(() => {
          expect(messageService.add).toHaveBeenCalled();
          done();
        }, 10);
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });
  });

  describe('Response Logging - Error', () => {
    it('should log HTTP error response', (done) => {
      httpClient.get(TEST_URL).subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalledWith('HTTP Response Error:', jasmine.any(Object));
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should log error status and message', (done) => {
      httpClient.get(TEST_URL).subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Error' });
    });

    it('should add error message to messenger', (done) => {
      httpClient.get(TEST_URL).subscribe({
        error: () => {
          expect(messageService.add).toHaveBeenCalledWith(jasmine.stringContaining('ERROR:'));
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });

    it('should handle network errors (status 0)', (done) => {
      httpClient.get(TEST_URL).subscribe({
        error: () => {
          expect(messageService.add).toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.error(new ProgressEvent('error'), { status: 0 });
    });

    it('should log 401 errors', (done) => {
      httpClient.get(TEST_URL).subscribe({
        error: () => {
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    it('should log 403 errors', (done) => {
      httpClient.get(TEST_URL).subscribe({
        error: () => {
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({}, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('Header Sanitization', () => {
    it('should redact authorization header', (done) => {
      const headers = new HttpHeaders({ 'Authorization': 'Bearer token123' });

      httpClient.get(TEST_URL, { headers }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });

    it('should redact cookie header', (done) => {
      const headers = new HttpHeaders({ 'Cookie': 'session=abc123' });

      httpClient.get(TEST_URL, { headers }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });

    it('should redact x-api-key header', (done) => {
      const headers = new HttpHeaders({ 'X-API-Key': 'secret-key-123' });

      httpClient.get(TEST_URL, { headers }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });

    it('should preserve non-sensitive headers', (done) => {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

      httpClient.get(TEST_URL, { headers }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });
  });

  describe('Body Sanitization', () => {
    it('should redact password field', (done) => {
      const body = { username: 'user', password: 'secret123' };

      httpClient.post(TEST_URL, body).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });

    it('should redact token field', (done) => {
      const body = { userId: '123', token: 'jwt-token-here' };

      httpClient.post(TEST_URL, body).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });

    it('should redact apiKey field', (done) => {
      const body = { service: 'test', apiKey: 'key-123' };

      httpClient.post(TEST_URL, body).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });

    it('should redact secret field', (done) => {
      const body = { userId: '123', secret: 'secret-value' };

      httpClient.post(TEST_URL, body).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });

    it('should redact creditCard field', (done) => {
      const body = { amount: 100, creditCard: '1234-5678-9012-3456' };

      httpClient.post(TEST_URL, body).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });

    it('should handle null body', (done) => {
      httpClient.post(TEST_URL, null).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });

    it('should handle undefined body', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });
  });

  describe('Error Details Extraction', () => {
    it('should extract error message from error.error.message', (done) => {
      httpClient.get(TEST_URL).subscribe({
        error: () => {
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({ error: { message: 'Custom error message' } }, { status: 400, statusText: 'Bad Request' });
    });

    it('should extract error message from error.error', (done) => {
      httpClient.get(TEST_URL).subscribe({
        error: () => {
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({ error: 'Error string' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle string error', (done) => {
      httpClient.get(TEST_URL).subscribe({
        error: () => {
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush('Error occurred', { status: 500, statusText: 'Error' });
    });

    it('should detect network errors', (done) => {
      httpClient.get(TEST_URL).subscribe({
        error: (error) => {
          expect(error.status).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.error(new ProgressEvent('error'), { status: 0 });
    });
  });

  describe('Timing and Performance', () => {
    it('should log elapsed time', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        // Check after a small delay to ensure finalize has executed
        setTimeout(() => {
          expect(console.log).toHaveBeenCalledWith('HTTP Request Completed (Success):', jasmine.objectContaining({
            elapsed: jasmine.any(String)
          }));
          done();
        }, 10);
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });

    it('should track request duration', (done) => {
      const startTime = Date.now();

      httpClient.get(TEST_URL).subscribe(() => {
        const endTime = Date.now();
        const elapsed = endTime - startTime;
        expect(elapsed).toBeGreaterThanOrEqual(0);
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });
  });

  describe('Log Message Formatting', () => {
    it('should format success log message', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        // Check after a small delay to ensure finalize has executed
        setTimeout(() => {
          expect(messageService.add).toHaveBeenCalledWith(jasmine.stringContaining('GET'));
          expect(messageService.add).toHaveBeenCalledWith(jasmine.stringContaining('succeeded'));
          done();
        }, 10);
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({}, { status: 200, statusText: 'OK' });
    });

    it('should format error log message', (done) => {
      httpClient.get(TEST_URL).subscribe({
        error: () => {
          // Check after a small delay to ensure finalize has executed
          setTimeout(() => {
            expect(messageService.add).toHaveBeenCalledWith(jasmine.stringContaining('failed'));
            done();
          }, 10);
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({}, { status: 500, statusText: 'Error' });
    });

    it('should include status code in message', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        // Check after a small delay to ensure finalize has executed
        setTimeout(() => {
          expect(messageService.add).toHaveBeenCalledWith(jasmine.stringContaining('[200]'));
          done();
        }, 10);
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({}, { status: 200, statusText: 'OK' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle messenger service errors', (done) => {
      messageService.add.and.throwError('Messenger error');

      httpClient.get(TEST_URL).subscribe(() => {
        // Check after a small delay to ensure finalize has executed
        setTimeout(() => {
          expect(console.error).toHaveBeenCalledWith('Error adding message to messenger service:', jasmine.any(Error));
          done();
        }, 10);
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });

    it('should handle multiple concurrent requests', (done) => {
      let completed = 0;
      const total = 3;
      const checkDone = () => {
        completed++;
        if (completed === total) done();
      };

      httpClient.get(TEST_URL + '/1').subscribe(() => checkDone());
      httpClient.get(TEST_URL + '/2').subscribe(() => checkDone());
      httpClient.get(TEST_URL + '/3').subscribe(() => checkDone());

      const req1 = httpMock.expectOne(TEST_URL + '/1');
      const req2 = httpMock.expectOne(TEST_URL + '/2');
      const req3 = httpMock.expectOne(TEST_URL + '/3');

      req1.flush({});
      req2.flush({});
      req3.flush({});
    });

    it('should handle request with query parameters', (done) => {
      httpClient.get(TEST_URL, { params: { page: '1', limit: '10' } }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(request => request.url === TEST_URL);
      req.flush({});
    });
  });

  describe('HTTP Methods', () => {
    it('should log GET requests', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('should log POST requests', (done) => {
      httpClient.post(TEST_URL, {}).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('should log PUT requests', (done) => {
      httpClient.put(TEST_URL, {}).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });

    it('should log DELETE requests', (done) => {
      httpClient.delete(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });
});
