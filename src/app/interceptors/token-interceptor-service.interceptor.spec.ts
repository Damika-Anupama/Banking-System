/**
 * Unit Tests for TokenInterceptorService
 *
 * Tests JWT token injection, validation, expiration handling, and error responses
 * Target coverage: 95%+
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TokenInterceptorService } from './token-interceptor-service.interceptor';

describe('TokenInterceptorService', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let router: jasmine.SpyObj<Router>;
  let interceptor: TokenInterceptorService;
  let localStorageSpy: jasmine.Spy;

  const TEST_URL = 'http://localhost:3000/api/test';

  // Helper function to create valid JWT token
  const createToken = (payload: any): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    const signature = btoa('signature');
    return `${header}.${body}.${signature}`;
  };

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TokenInterceptorService,
        { provide: Router, useValue: routerSpy },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: TokenInterceptorService,
          multi: true
        }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    interceptor = TestBed.inject(TokenInterceptorService);

    // Setup localStorage spy
    localStorageSpy = spyOn(localStorage, 'getItem');
    spyOn(localStorage, 'removeItem');
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

    it('should be provided in root', () => {
      expect(interceptor).toBeInstanceOf(TokenInterceptorService);
    });
  });

  describe('Token Injection - Valid Token', () => {
    it('should add Authorization header with valid token', (done) => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createToken({ exp: futureTime, userId: '123' });
      localStorageSpy.and.returnValue(validToken);

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBe(true);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
      req.flush({});
    });

    it('should add Authorization header with token without expiry', (done) => {
      const tokenWithoutExp = createToken({ userId: '123', role: 'user' });
      localStorageSpy.and.returnValue(tokenWithoutExp);

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${tokenWithoutExp}`);
      req.flush({});
    });

    it('should preserve original request body', (done) => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createToken({ exp: futureTime });
      localStorageSpy.and.returnValue(validToken);
      const testData = { name: 'test', value: 123 };

      httpClient.post(TEST_URL, testData).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.body).toEqual(testData);
      expect(req.request.headers.has('Authorization')).toBe(true);
      req.flush({});
    });

    it('should preserve original request params', (done) => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createToken({ exp: futureTime });
      localStorageSpy.and.returnValue(validToken);

      httpClient.get(TEST_URL, { params: { page: '1', limit: '10' } }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(request => request.url === TEST_URL);
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('10');
      req.flush({});
    });
  });

  describe('Token Injection - No Token', () => {
    it('should not add Authorization header when token is null', (done) => {
      localStorageSpy.and.returnValue(null);

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should not add Authorization header when token is undefined', (done) => {
      localStorageSpy.and.returnValue(undefined);

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should not add Authorization header when token is empty string', (done) => {
      localStorageSpy.and.returnValue('');

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('Token Injection - Invalid Token Format', () => {
    it('should not add header for token with 2 parts', (done) => {
      const invalidToken = 'header.payload';
      localStorageSpy.and.returnValue(invalidToken);

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBe(false);
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(console.error).toHaveBeenCalledWith('Invalid token format, removing from storage');
      req.flush({});
    });

    it('should not add header for token with 4 parts', (done) => {
      const invalidToken = 'header.payload.signature.extra';
      localStorageSpy.and.returnValue(invalidToken);

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBe(false);
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      req.flush({});
    });

    it('should not add header for token with empty parts', (done) => {
      const invalidToken = 'header..signature';
      localStorageSpy.and.returnValue(invalidToken);

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('Token Injection - Expired Token', () => {
    it('should not add header for expired token', (done) => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = createToken({ exp: pastTime, userId: '123' });
      localStorageSpy.and.returnValue(expiredToken);

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBe(false);
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(console.warn).toHaveBeenCalledWith('Token expired, removing from storage');
      req.flush({});
    });

    it('should not add header for token expiring now', (done) => {
      const currentTime = Math.floor(Date.now() / 1000);
      const expiredToken = createToken({ exp: currentTime });
      localStorageSpy.and.returnValue(expiredToken);

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('Error Handling - 401 Unauthorized', () => {
    it('should handle 401 error and redirect to welcome', (done) => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createToken({ exp: futureTime });
      localStorageSpy.and.returnValue(validToken);

      httpClient.get(TEST_URL).subscribe({
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(401);
          expect(localStorage.removeItem).toHaveBeenCalledWith('token');
          expect(router.navigate).toHaveBeenCalledWith(['/welcome'], {
            queryParams: {
              error: 'session_expired',
              message: 'Your session has expired. Please login again.'
            }
          });
          expect(console.error).toHaveBeenCalledWith('Unauthorized request (401):', jasmine.any(String));
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should clear token on 401 error', (done) => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createToken({ exp: futureTime });
      localStorageSpy.and.returnValue(validToken);

      httpClient.get(TEST_URL).subscribe({
        error: () => {
          expect(localStorage.removeItem).toHaveBeenCalledWith('token');
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Error Handling - 403 Forbidden', () => {
    it('should handle 403 error and log warning', (done) => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createToken({ exp: futureTime });
      localStorageSpy.and.returnValue(validToken);

      httpClient.get(TEST_URL).subscribe({
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(403);
          expect(console.error).toHaveBeenCalledWith('Forbidden request (403):', jasmine.any(String));
          expect(console.warn).toHaveBeenCalledWith('User does not have permission to access this resource');
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    });

    it('should not clear token on 403 error', (done) => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createToken({ exp: futureTime });
      localStorageSpy.and.returnValue(validToken);

      httpClient.get(TEST_URL).subscribe({
        error: () => {
          // Token should not be removed for 403 (user is authenticated but not authorized)
          expect(localStorage.removeItem).not.toHaveBeenCalledWith('token');
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({}, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('Error Handling - Network Errors', () => {
    it('should handle status 0 network error', (done) => {
      localStorageSpy.and.returnValue(null);

      httpClient.get(TEST_URL).subscribe({
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(0);
          expect(console.error).toHaveBeenCalledWith('Network error or CORS issue:', jasmine.any(Object));
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.error(new ProgressEvent('error'), { status: 0 });
    });

    it('should handle other HTTP errors', (done) => {
      localStorageSpy.and.returnValue(null);

      httpClient.get(TEST_URL).subscribe({
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(500);
          expect(console.error).toHaveBeenCalledWith('HTTP error:', 500, jasmine.any(String));
          done();
        }
      });

      const req = httpMock.expectOne(TEST_URL);
      req.flush({ message: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('LocalStorage Error Handling', () => {
    it('should handle localStorage access error', (done) => {
      localStorageSpy.and.throwError('Storage error');

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error accessing localStorage in token interceptor:', jasmine.any(Error));
      req.flush({});
    });

    it('should proceed without token when localStorage throws', (done) => {
      localStorageSpy.and.throwError('Cannot read localStorage');

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('Private Method - isValidToken', () => {
    it('should validate correct JWT format', (done) => {
      const validToken = createToken({ userId: '123' });
      localStorageSpy.and.returnValue(validToken);

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBe(true);
      req.flush({});
    });

    it('should reject null token', (done) => {
      localStorageSpy.and.returnValue(null);

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('Private Method - isTokenExpired', () => {
    it('should return false for future expiration', (done) => {
      const futureTime = Math.floor(Date.now() / 1000) + 7200;
      const token = createToken({ exp: futureTime });
      localStorageSpy.and.returnValue(token);

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBe(true);
      req.flush({});
    });

    it('should handle token with malformed payload', (done) => {
      const invalidToken = 'header.!@#invalid$%^.signature';
      localStorageSpy.and.returnValue(invalidToken);

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple concurrent requests with same token', (done) => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createToken({ exp: futureTime });
      localStorageSpy.and.returnValue(validToken);

      let completed = 0;
      const checkDone = () => {
        completed++;
        if (completed === 3) done();
      };

      httpClient.get(TEST_URL + '/1').subscribe(() => checkDone());
      httpClient.get(TEST_URL + '/2').subscribe(() => checkDone());
      httpClient.get(TEST_URL + '/3').subscribe(() => checkDone());

      const req1 = httpMock.expectOne(TEST_URL + '/1');
      const req2 = httpMock.expectOne(TEST_URL + '/2');
      const req3 = httpMock.expectOne(TEST_URL + '/3');

      expect(req1.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
      expect(req2.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
      expect(req3.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);

      req1.flush({});
      req2.flush({});
      req3.flush({});
    });

    it('should handle token with special characters in payload', (done) => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        name: 'John Doe',
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const token = createToken(payload);
      localStorageSpy.and.returnValue(token);

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      // Token should have Authorization header
      expect(req.request.headers.has('Authorization')).toBe(true);
      req.flush({});
    });

    it('should handle base64url encoding with - and _', (done) => {
      const header = btoa('{"alg":"HS256"}').replace(/\+/g, '-').replace(/\//g, '_');
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureTime })).replace(/\+/g, '-').replace(/\//g, '_');
      const signature = btoa('signature').replace(/\+/g, '-').replace(/\//g, '_');
      const token = `${header}.${payload}.${signature}`;

      localStorageSpy.and.returnValue(token);

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBe(true);
      req.flush({});
    });
  });

  describe('Method Types', () => {
    it('should handle GET requests', (done) => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createToken({ exp: futureTime });
      localStorageSpy.and.returnValue(validToken);

      httpClient.get(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.has('Authorization')).toBe(true);
      req.flush({});
    });

    it('should handle POST requests', (done) => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createToken({ exp: futureTime });
      localStorageSpy.and.returnValue(validToken);

      httpClient.post(TEST_URL, { data: 'test' }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.has('Authorization')).toBe(true);
      req.flush({});
    });

    it('should handle PUT requests', (done) => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createToken({ exp: futureTime });
      localStorageSpy.and.returnValue(validToken);

      httpClient.put(TEST_URL, { data: 'test' }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.has('Authorization')).toBe(true);
      req.flush({});
    });

    it('should handle DELETE requests', (done) => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createToken({ exp: futureTime });
      localStorageSpy.and.returnValue(validToken);

      httpClient.delete(TEST_URL).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(TEST_URL);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.has('Authorization')).toBe(true);
      req.flush({});
    });
  });
});
