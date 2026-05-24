import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardGuard  {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    try {
      // Check if localStorage is accessible
      if (typeof localStorage === 'undefined') {
        console.error('localStorage is not available');
        return this.router.createUrlTree(['/welcome'], {
          queryParams: { error: 'storage_unavailable' }
        });
      }

      const token = localStorage.getItem('token');

      // Check if token exists
      if (!token) {
        console.warn('No token found, redirecting to welcome page');
        return this.router.createUrlTree(['/welcome'], {
          queryParams: { error: 'no_token' }
        });
      }

      // Validate JWT token format (basic validation)
      if (!this.isValidJWTFormat(token)) {
        console.error('Invalid token format detected');
        localStorage.removeItem('token');
        return this.router.createUrlTree(['/welcome'], {
          queryParams: { error: 'invalid_token' }
        });
      }

      // Check if token is expired
      if (this.isTokenExpired(token)) {
        console.warn('Token has expired');
        localStorage.removeItem('token');
        return this.router.createUrlTree(['/welcome'], {
          queryParams: { error: 'token_expired' }
        });
      }

      // Token is valid
      return true;
    } catch (error) {
      console.error('Error in dashboard guard:', error);
      return this.router.createUrlTree(['/welcome'], {
        queryParams: { error: 'auth_error' }
      });
    }
  }

  /**
   * Validates if the token has a valid JWT format (header.payload.signature)
   */
  private isValidJWTFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Check if each part is base64 encoded
    try {
      parts.forEach(part => {
        if (!part || part.length === 0) {
          throw new Error('Invalid part');
        }
        atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Checks if the JWT token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeTokenPayload(token);

      if (!payload || !payload.exp) {
        // If no expiry is set, consider token as valid
        return false;
      }

      // JWT exp is in seconds, Date.now() is in milliseconds
      const expirationDate = payload.exp * 1000;
      const currentDate = Date.now();

      return currentDate >= expirationDate;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      // If we can't decode, consider it expired for safety
      return true;
    }
  }

  /**
   * Decodes the JWT payload
   */
  private decodeTokenPayload(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token payload:', error);
      return null;
    }
  }
}
