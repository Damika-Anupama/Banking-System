import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoanService {

  constructor(private http: HttpClient) { }

  /**
   * Retrieves fixed deposits for the current user
   * @returns Observable with fixed deposit data
   */
  getFDs(): Observable<any> {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      return throwError(() => new Error('User ID not found in local storage'));
    }

    return this.http.get<any>(environment.baseUrl + `/api/v1/fd/user/${userId}`)
      .pipe(
        timeout(30000),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Retrieves loans for the current user
   * @returns Observable with loan data
   */
  getLoans(): Observable<any> {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      return throwError(() => new Error('User ID not found in local storage'));
    }

    return this.http.get<any>(environment.baseUrl + `/api/v1/loan/user/${userId}`)
      .pipe(
        timeout(30000),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Applies for a new loan
   * @param fdId - Fixed deposit ID to use as collateral
   * @param loanAmount - Loan amount requested
   * @param userId - Customer ID
   * @param duration - Loan duration in days
   * @param interest - Interest rate
   * @param selectedLoanType - Type of loan
   * @returns Observable with loan application response
   */
  applyLoan(fdId: number, loanAmount: number, userId: any, duration: string, interest: string, selectedLoanType: string): Observable<any> {
    // Input validation
    if (!fdId || fdId <= 0) {
      return throwError(() => new Error('Valid fixed deposit ID is required'));
    }
    if (!loanAmount || loanAmount <= 0) {
      return throwError(() => new Error('Loan amount must be greater than zero'));
    }
    if (!userId) {
      return throwError(() => new Error('User ID is required'));
    }
    if (!duration || parseInt(duration) <= 0) {
      return throwError(() => new Error('Valid loan duration is required'));
    }
    if (!interest || parseFloat(interest) < 0) {
      return throwError(() => new Error('Valid interest rate is required'));
    }
    if (!selectedLoanType || selectedLoanType.trim().length === 0) {
      return throwError(() => new Error('Loan type is required'));
    }

    const body = {
      fixed_deposit_id: fdId,
      amount: loanAmount,
      customer_id: userId,
      duration_days: duration,
      interest: interest,
      loan_type: selectedLoanType
    };

    return this.http.post<any>(environment.baseUrl + `/api/v1/loan/online`, body)
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
