/**
 * Unit Tests for DashboardGuard
 *
 * Tests route protection, JWT validation, token expiration, and error handling
 * Target coverage: 95%+
 */

import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { DashboardGuard } from './dashboard.guard';

describe('DashboardGuard', () => {
  let guard: DashboardGuard;
  let router: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;
  let localStorageSpy: jasmine.Spy;

  // Helper function to create valid JWT token
  const createToken = (payload: any): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    const signature = btoa('signature');
    return `${header}.${body}.${signature}`;
  };

  beforeEach(() => {
    // Create router spy
    const routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        DashboardGuard,
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(DashboardGuard);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Mock route and state
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/dashboard' } as RouterStateSnapshot;

    // Setup localStorage spy
    localStorageSpy = spyOn(localStorage, 'getItem');
    spyOn(localStorage, 'removeItem');
    spyOn(localStorage, 'setItem');
    spyOn(console, 'error');
    spyOn(console, 'warn');

    // Default router.createUrlTree behavior
    router.createUrlTree.and.returnValue({} as UrlTree);
  });

  describe('Guard Creation', () => {
    it('should create', () => {
      expect(guard).toBeTruthy();
    });

    it('should be provided in root', () => {
      expect(guard).toBeInstanceOf(DashboardGuard);
    });
  });

  describe('canActivate - Valid Token', () => {
    it('should allow access with valid non-expired token', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validToken = createToken({ exp: futureTime, userId: '123' });
      localStorageSpy.and.returnValue(validToken);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(true);
      expect(router.createUrlTree).not.toHaveBeenCalled();
    });

    it('should allow access with token without expiry', () => {
      const tokenWithoutExp = createToken({ userId: '123', role: 'user' });
      localStorageSpy.and.returnValue(tokenWithoutExp);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(true);
    });

    it('should not remove token when valid', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createToken({ exp: futureTime });
      localStorageSpy.and.returnValue(validToken);

      guard.canActivate(mockRoute, mockState);

      expect(localStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('canActivate - No Token', () => {
    it('should redirect to welcome when token is null', () => {
      localStorageSpy.and.returnValue(null);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBeInstanceOf(Object); // UrlTree
      expect(router.createUrlTree).toHaveBeenCalledWith(['/welcome'], {
        queryParams: { error: 'no_token' }
      });
      expect(console.warn).toHaveBeenCalledWith('No token found, redirecting to welcome page');
    });

    it('should redirect to welcome when token is undefined', () => {
      localStorageSpy.and.returnValue(undefined);

      const result = guard.canActivate(mockRoute, mockState);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/welcome'], {
        queryParams: { error: 'no_token' }
      });
    });

    it('should redirect to welcome when token is empty string', () => {
      localStorageSpy.and.returnValue('');

      const result = guard.canActivate(mockRoute, mockState);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/welcome'], {
        queryParams: { error: 'no_token' }
      });
    });
  });

  describe('canActivate - Invalid Token Format', () => {
    it('should reject token with only 2 parts', () => {
      const invalidToken = 'header.payload'; // Missing signature
      localStorageSpy.and.returnValue(invalidToken);

      const result = guard.canActivate(mockRoute, mockState);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/welcome'], {
        queryParams: { error: 'invalid_token' }
      });
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(console.error).toHaveBeenCalledWith('Invalid token format detected');
    });

    it('should reject token with only 1 part', () => {
      const invalidToken = 'onlyheader';
      localStorageSpy.and.returnValue(invalidToken);

      const result = guard.canActivate(mockRoute, mockState);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/welcome'], {
        queryParams: { error: 'invalid_token' }
      });
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('should reject token with 4 parts', () => {
      const invalidToken = 'header.payload.signature.extra';
      localStorageSpy.and.returnValue(invalidToken);

      const result = guard.canActivate(mockRoute, mockState);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/welcome'], {
        queryParams: { error: 'invalid_token' }
      });
    });

    it('should reject token with empty parts', () => {
      const invalidToken = 'header..signature'; // Empty payload
      localStorageSpy.and.returnValue(invalidToken);

      const result = guard.canActivate(mockRoute, mockState);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/welcome'], {
        queryParams: { error: 'invalid_token' }
      });
    });

    it('should reject token with non-base64 characters', () => {
      const invalidToken = 'not-base64!@#.payload.signature';
      localStorageSpy.and.returnValue(invalidToken);

      const result = guard.canActivate(mockRoute, mockState);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/welcome'], {
        queryParams: { error: 'invalid_token' }
      });
    });
  });

  describe('canActivate - Expired Token', () => {
    it('should reject expired token', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredToken = createToken({ exp: pastTime, userId: '123' });
      localStorageSpy.and.returnValue(expiredToken);

      const result = guard.canActivate(mockRoute, mockState);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/welcome'], {
        queryParams: { error: 'token_expired' }
      });
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(console.warn).toHaveBeenCalledWith('Token has expired');
    });

    it('should reject token expiring exactly now', () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const expiredToken = createToken({ exp: currentTime });
      localStorageSpy.and.returnValue(expiredToken);

      const result = guard.canActivate(mockRoute, mockState);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/welcome'], {
        queryParams: { error: 'token_expired' }
      });
    });

    it('should remove expired token from localStorage', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 100;
      const expiredToken = createToken({ exp: pastTime });
      localStorageSpy.and.returnValue(expiredToken);

      guard.canActivate(mockRoute, mockState);

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('canActivate - LocalStorage Unavailable', () => {
    it('should handle localStorage access errors', () => {
      // Simulate localStorage throwing an error when accessed
      localStorageSpy.and.throwError('localStorage not available');

      const result = guard.canActivate(mockRoute, mockState);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/welcome'], {
        queryParams: { error: 'auth_error' }
      });
      expect(console.error).toHaveBeenCalledWith('Error in dashboard guard:', jasmine.any(Error));
    });
  });

  describe('canActivate - Error Handling', () => {
    it('should handle errors in token validation', () => {
      localStorageSpy.and.throwError('Storage error');

      const result = guard.canActivate(mockRoute, mockState);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/welcome'], {
        queryParams: { error: 'auth_error' }
      });
      expect(console.error).toHaveBeenCalledWith('Error in dashboard guard:', jasmine.any(Error));
    });

    it('should handle JSON parse errors in token payload', () => {
      // Create token with invalid JSON payload
      const header = btoa(JSON.stringify({ alg: 'HS256' }));
      const invalidPayload = btoa('not valid json {]');
      const signature = btoa('signature');
      const invalidToken = `${header}.${invalidPayload}.${signature}`;

      localStorageSpy.and.returnValue(invalidToken);

      const result = guard.canActivate(mockRoute, mockState);

      // Should be treated as valid format but expired since payload can't be decoded
      // The guard will return true if token format is valid, even if payload decode fails
      expect(result).toBe(true);
    });
  });

  describe('Private Method - isValidJWTFormat', () => {
    it('should validate correct JWT format', () => {
      const validToken = createToken({ userId: '123' });
      localStorageSpy.and.returnValue(validToken);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(true);
    });

    it('should reject null token', () => {
      localStorageSpy.and.returnValue(null);

      const result = guard.canActivate(mockRoute, mockState);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/welcome'], {
        queryParams: { error: 'no_token' }
      });
    });

    it('should handle base64url encoding with - and _', () => {
      // JWT tokens can use base64url encoding with - and _ instead of + and /
      const header = btoa('{"alg":"HS256"}').replace(/\+/g, '-').replace(/\//g, '_');
      const payload = btoa('{"userId":"123"}').replace(/\+/g, '-').replace(/\//g, '_');
      const signature = btoa('signature').replace(/\+/g, '-').replace(/\//g, '_');
      const token = `${header}.${payload}.${signature}`;

      localStorageSpy.and.returnValue(token);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(true);
    });
  });

  describe('Private Method - isTokenExpired', () => {
    it('should return false for future expiration', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now
      const token = createToken({ exp: futureTime });
      localStorageSpy.and.returnValue(token);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(true);
    });

    it('should return false when no exp claim exists', () => {
      const token = createToken({ userId: '123', role: 'admin' });
      localStorageSpy.and.returnValue(token);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(true);
    });

    it('should return true for past expiration', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 1000;
      const token = createToken({ exp: pastTime });
      localStorageSpy.and.returnValue(token);

      const result = guard.canActivate(mockRoute, mockState);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/welcome'], {
        queryParams: { error: 'token_expired' }
      });
    });
  });

  describe('Private Method - decodeTokenPayload', () => {
    it('should decode valid payload', () => {
      const payload = { userId: '123', role: 'user', exp: 9999999999 };
      const token = createToken(payload);
      localStorageSpy.and.returnValue(token);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(true);
    });

    it('should handle malformed base64 in payload', () => {
      const invalidToken = 'header.!@#$%^&*().signature';
      localStorageSpy.and.returnValue(invalidToken);

      const result = guard.canActivate(mockRoute, mockState);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/welcome'], {
        queryParams: { error: 'invalid_token' }
      });
    });

    it('should handle payload with special characters', () => {
      const payload = {
        userId: '123',
        email: 'user@example.com',
        name: 'John Döe',
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const token = createToken(payload);
      localStorageSpy.and.returnValue(token);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle token with exactly current timestamp', () => {
      const exactNow = Math.floor(Date.now() / 1000);
      const token = createToken({ exp: exactNow });
      localStorageSpy.and.returnValue(token);

      const result = guard.canActivate(mockRoute, mockState);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/welcome'], {
        queryParams: { error: 'token_expired' }
      });
    });

    it('should handle token expiring in 1 second', () => {
      const almostExpired = Math.floor(Date.now() / 1000) + 1;
      const token = createToken({ exp: almostExpired });
      localStorageSpy.and.returnValue(token);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(true);
    });

    it('should handle very long token', () => {
      const payload = {
        userId: '123',
        data: 'x'.repeat(1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const token = createToken(payload);
      localStorageSpy.and.returnValue(token);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(true);
    });

    it('should handle token with numeric exp as string', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = { exp: futureTime.toString() }; // exp as string instead of number
      const header = btoa(JSON.stringify({ alg: 'HS256' }));
      const body = btoa(JSON.stringify(payload));
      const signature = btoa('signature');
      const token = `${header}.${body}.${signature}`;

      localStorageSpy.and.returnValue(token);

      // Should still work because JavaScript coerces strings in comparisons
      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(true);
    });

    it('should handle token with null exp', () => {
      const token = createToken({ userId: '123', exp: null });
      localStorageSpy.and.returnValue(token);

      const result = guard.canActivate(mockRoute, mockState);

      // Should allow access since no valid exp means no expiration
      expect(result).toBe(true);
    });
  });

  describe('Return Types', () => {
    it('should return boolean true for valid access', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const token = createToken({ exp: futureTime });
      localStorageSpy.and.returnValue(token);

      const result = guard.canActivate(mockRoute, mockState);

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });

    it('should return UrlTree for denied access', () => {
      localStorageSpy.and.returnValue(null);
      const mockUrlTree = {} as UrlTree;
      router.createUrlTree.and.returnValue(mockUrlTree);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBe(mockUrlTree);
    });
  });
});
