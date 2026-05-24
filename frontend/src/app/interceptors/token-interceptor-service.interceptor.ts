import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class TokenInterceptorService implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    let tokenizedReq: HttpRequest<any>;

    try {
      // Check if localStorage is accessible
      if (typeof localStorage === 'undefined') {
        console.error('localStorage is not available in token interceptor');
        tokenizedReq = req.clone();
        return next.handle(tokenizedReq);
      }

      const token = localStorage.getItem('token');

      // If token exists, validate and add to request
      if (token) {
        // Basic token validation
        if (this.isValidToken(token)) {
          // Check if token is expired
          if (!this.isTokenExpired(token)) {
            tokenizedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`,
              },
            });
          } else {
            console.warn('Token expired, removing from storage');
            localStorage.removeItem('token');
            tokenizedReq = req.clone();
          }
        } else {
          console.error('Invalid token format, removing from storage');
          localStorage.removeItem('token');
          tokenizedReq = req.clone();
        }
      } else {
        tokenizedReq = req.clone();
      }
    } catch (error) {
      console.error('Error accessing localStorage in token interceptor:', error);
      tokenizedReq = req.clone();
    }

    // Handle the request and catch errors
    return next.handle(tokenizedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Unauthorized - token is invalid or expired
          console.error('Unauthorized request (401):', error.message);
          this.handleUnauthorized();
        } else if (error.status === 403) {
          // Forbidden - user doesn't have permission
          console.error('Forbidden request (403):', error.message);
          this.handleForbidden();
        } else if (error.status === 0) {
          // Network error or CORS issue
          console.error('Network error or CORS issue:', error);
        } else {
          console.error('HTTP error:', error.status, error.message);
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Validates if the token has a valid JWT format
   */
  private isValidToken(token: string): boolean {
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
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);

      if (!payload.exp) {
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
   * Handles 401 Unauthorized responses
   */
  private handleUnauthorized(): void {
    try {
      // Clear token from storage
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token');
      }

      // Redirect to login/welcome page
      this.router.navigate(['/welcome'], {
        queryParams: { error: 'session_expired', message: 'Your session has expired. Please login again.' }
      });
    } catch (error) {
      console.error('Error handling unauthorized response:', error);
    }
  }

  /**
   * Handles 403 Forbidden responses
   */
  private handleForbidden(): void {
    try {
      // User is authenticated but doesn't have permission
      // You might want to show a notification or redirect to an error page
      console.warn('User does not have permission to access this resource');
      // Optionally redirect to an access denied page
      // this.router.navigate(['/access-denied']);
    } catch (error) {
      console.error('Error handling forbidden response:', error);
    }
  }
}
