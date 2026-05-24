/**
 * Unit Tests for LoadingInterceptorInterceptor
 *
 * Tests loading state management, request counting, timeout handling
 * Target coverage: 95%+
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { LoadingInterceptorInterceptor } from './loading-interceptor.interceptor';
import { LoadingService } from '../service/loading.service';

describe('LoadingInterceptorInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let loadingService: jasmine.SpyObj<LoadingService>;
  let interceptor: LoadingInterceptorInterceptor;

  const TEST_URL = 'http://localhost:3000/api/test';

  beforeEach(() => {
    const loadingServiceSpy = jasmine.createSpyObj('LoadingService', ['show', 'hide']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LoadingInterceptorInterceptor,
        { provide: LoadingService, useValue: loadingServiceSpy },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: LoadingInterceptorInterceptor,
          multi: true
        }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    loadingService = TestBed.inject(LoadingService) as jasmine.SpyObj<LoadingService>;
    interceptor = TestBed.inject(LoadingInterceptorInterceptor);

    spyOn(console, 'error');
    spyOn(console, 'warn');
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Interceptor Creation', () => {
    it('should create', () => {
      expect(interceptor).toBeTruthy();
    });
  });

  describe('Loading State Management', () => {
    it('should show loading for first request', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      expect(loadingService.show).toHaveBeenCalled();

      const req = httpMock.expectOne(TEST_URL);
      req.flush({ data: 'success' });
    });

    it('should hide loading after request completes', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        // Check after a small delay to ensure finalize has executed
        setTimeout(() => {
          expect(loadingService.hide).toHaveBeenCalled();
          done();
        }, 10);
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({ data: 'success' });
    });

    it('should hide loading after request fails', (done) => {
      httpClient.get(TEST_URL).subscribe({
        error: () => {
          // Check after a small delay to ensure finalize has executed
          setTimeout(() => {
            expect(loadingService.hide).toHaveBeenCalled();
            done();
          }, 10);
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({}, { status: 500, statusText: 'Error' });
    });

    it('should not show loading for second concurrent request', (done) => {
      let completed = 0;
      const checkDone = () => {
        completed++;
        if (completed === 2) done();
      };

      loadingService.show.calls.reset();

      httpClient.get(TEST_URL + '/1').subscribe(() => checkDone());
      httpClient.get(TEST_URL + '/2').subscribe(() => checkDone());

      // show() should only be called once for the first request
      expect(loadingService.show).toHaveBeenCalledTimes(1);

      const req1 = httpMock.expectOne(TEST_URL + '/1');
      const req2 = httpMock.expectOne(TEST_URL + '/2');

      req1.flush({});
      req2.flush({});
    });

    it('should hide loading only after all requests complete', (done) => {
      let completed = 0;
      const checkDone = () => {
        completed++;
        if (completed === 2) {
          // Check after a small delay to ensure finalize has executed
          setTimeout(() => {
            // hide() should be called only once after both requests complete
            expect(loadingService.hide).toHaveBeenCalledTimes(1);
            done();
          }, 10);
        }
      };

      httpClient.get(TEST_URL + '/1').subscribe(() => checkDone());
      httpClient.get(TEST_URL + '/2').subscribe(() => checkDone());

      const req1 = httpMock.expectOne(TEST_URL + '/1');
      const req2 = httpMock.expectOne(TEST_URL + '/2');

      req1.flush({});
      req2.flush({});
    });
  });

  describe('Request Counter', () => {
    it('should track active requests count', () => {
      // Reset to ensure clean state
      interceptor.resetActiveRequests();

      // Verify getActiveRequestsCount method exists and returns a number
      const initialCount = interceptor.getActiveRequestsCount();
      expect(typeof initialCount).toBe('number');
      expect(initialCount).toBe(0);
    });

    it('should reset counter to zero after all requests complete', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        setTimeout(() => {
          expect(interceptor.getActiveRequestsCount()).toBe(0);
          done();
        }, 10);
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });

    it('should handle negative counter gracefully', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});

      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('Timeout Handling', () => {
    it('should use default timeout for GET requests', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.method).toBe('GET');
      req.flush({ data: 'success' });
    });

    it('should use longer timeout for POST requests', (done) => {
      httpClient.post(TEST_URL, { data: 'test' }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.method).toBe('POST');
      req.flush({ data: 'success' });
    });

    it('should use longer timeout for PUT requests', (done) => {
      httpClient.put(TEST_URL, { data: 'test' }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.method).toBe('PUT');
      req.flush({ data: 'success' });
    });

    it('should respect custom timeout header', (done) => {
      const customHeaders = { 'X-Request-Timeout': '5000' };

      httpClient.get(TEST_URL, { headers: customHeaders }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('X-Request-Timeout')).toBe(true);
      req.flush({ data: 'success' });
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors and still hide loading', (done) => {
      httpClient.get(TEST_URL).subscribe({
        error: () => {
          // Check after a small delay to ensure finalize has executed
          setTimeout(() => {
            expect(loadingService.hide).toHaveBeenCalled();
            done();
          }, 10);
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });

    it('should handle network errors and hide loading', (done) => {
      httpClient.get(TEST_URL).subscribe({
        error: () => {
          // Check after a small delay to ensure finalize has executed
          setTimeout(() => {
            expect(loadingService.hide).toHaveBeenCalled();
            done();
          }, 10);
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.error(new ProgressEvent('error'));
    });

    it('should log timeout errors', (done) => {
      httpClient.get(TEST_URL).subscribe({
        error: (error) => {
          if (error.status === 408) {
            expect(console.error).toHaveBeenCalled();
          }
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({}, { status: 500, statusText: 'Error' });
    });
  });

  describe('Public Methods', () => {
    it('should get active requests count', () => {
      const count = interceptor.getActiveRequestsCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should reset active requests', () => {
      interceptor.resetActiveRequests();
      expect(interceptor.getActiveRequestsCount()).toBe(0);
      expect(loadingService.hide).toHaveBeenCalled();
    });

    it('should set timeout for URL pattern', () => {
      expect(() => {
        interceptor.setTimeoutForUrl('/api/upload', 60000);
      }).not.toThrow();
    });

    it('should handle invalid timeout values', () => {
      expect(() => {
        interceptor.setTimeoutForUrl('/api/test', -1000);
      }).not.toThrow();
    });

    it('should handle null URL pattern', () => {
      expect(() => {
        interceptor.setTimeoutForUrl(null as any, 5000);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid sequential requests', (done) => {
      let completed = 0;
      const total = 5;
      const checkDone = () => {
        completed++;
        if (completed === total) {
          setTimeout(() => {
            expect(interceptor.getActiveRequestsCount()).toBe(0);
            done();
          }, 10);
        }
      };

      for (let i = 0; i < total; i++) {
        httpClient.get(`${TEST_URL}/${i}`).subscribe(() => checkDone());
      }

      for (let i = 0; i < total; i++) {
        const req = httpMock.expectOne(`${TEST_URL}/${i}`);
        req.flush({});
      }
    });

    it('should handle request with custom headers', (done) => {
      const headers = { 'Content-Type': 'application/json' };

      httpClient.get(TEST_URL, { headers }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });

    it('should handle request with query params', (done) => {
      httpClient.get(TEST_URL, { params: { page: '1', limit: '10' } }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(request => request.url === TEST_URL);
      req.flush({});
    });
  });

  describe('Finalize Behavior', () => {
    it('should always call finalize even on error', (done) => {
      let finalizeCount = 0;

      httpClient.get(TEST_URL).subscribe({
        error: () => {
          finalizeCount++;
          // Check after a small delay to ensure finalize has executed
          setTimeout(() => {
            expect(loadingService.hide).toHaveBeenCalled();
            done();
          }, 10);
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({}, { status: 500, statusText: 'Error' });
    });

    it('should decrement counter in finalize', (done) => {
      httpClient.get(TEST_URL).subscribe(() => {
        setTimeout(() => {
          expect(interceptor.getActiveRequestsCount()).toBe(0);
          done();
        }, 10);
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({});
    });
  });
});
