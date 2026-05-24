import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, retry, timeout} from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegisterCustomerService {

  constructor(private http: HttpClient) {
  }

  /**
   * Registers a new customer account
   * @param body - Customer registration data
   * @returns Observable with registration response
   */
  registerCustomer(body: any): Observable<any> {
    // Input validation
    if (!body) {
      return throwError(() => new Error('Registration data is required'));
    }
    if (!body.email || !body.email.includes('@')) {
      return throwError(() => new Error('Invalid email address'));
    }
    if (!body.username || body.username.trim().length < 3) {
      return throwError(() => new Error('Username must be at least 3 characters'));
    }
    if (!body.password || body.password.length < 6) {
      return throwError(() => new Error('Password must be at least 6 characters'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(`${environment.baseUrl}/api/user`, body, {headers})
      .pipe(
        timeout(30000),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Handles HTTP errors
   * @param error - The HTTP error response
   * @returns Observable that throws an error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Server returned code ${error.status}`;
    }

    console.error('Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
