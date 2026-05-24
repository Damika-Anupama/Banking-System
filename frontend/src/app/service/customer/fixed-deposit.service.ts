import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FixedDepositService {
  constructor(private http: HttpClient) {}

  /**
   * Retrieves savings account details for the current user
   * @returns Observable with savings account data
   */
  getSavingAccountsDetails(): Observable<any> {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      return throwError(() => new Error('User ID not found in local storage'));
    }

    return this.http.get<any>(
      environment.baseUrl + `/api/v1/fd/savingAccountsDetails/${userId}`
    ).pipe(
      timeout(30000),
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * Creates a new fixed deposit
   * @param savingsAccountId - Savings account ID
   * @param duration - Duration of the fixed deposit
   * @param interest - Interest rate per annum
   * @param amount - Fixed deposit amount
   * @returns Observable with fixed deposit creation response
   */
  createFD(
    savingsAccountId: any,
    duration: any,
    interest: any,
    amount: any
  ): Observable<any> {
    // Input validation
    if (!savingsAccountId) {
      return throwError(() => new Error('Savings account ID is required'));
    }
    if (!duration || parseInt(duration) <= 0) {
      return throwError(() => new Error('Valid duration is required'));
    }
    if (!interest || parseFloat(interest) < 0) {
      return throwError(() => new Error('Valid interest rate is required'));
    }
    if (!amount || parseFloat(amount) <= 0) {
      return throwError(() => new Error('Amount must be greater than zero'));
    }

    const body = {
      saving_account_id: savingsAccountId,
      duration: duration,
      rate_per_annum: interest,
      amount: amount,
    };

    return this.http.post<any>(environment.baseUrl + `/api/v1/fd`, body)
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
