import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ManagerHomeService {
  constructor(private http: HttpClient) {}

  /**
   * Retrieves dashboard block details for the manager
   * @returns Observable with dashboard block data
   */
  getDashboardBlockDetails(): Observable<any> {
    const email = localStorage.getItem('email');
    if (!email) {
      return throwError(() => new Error('Manager email not found in local storage'));
    }

    return this.http.get<any>(environment.baseUrl + `/api/v1/manager/dashboard-blocks/${email}`)
      .pipe(
        timeout(30000),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Retrieves total transactions for a specific branch
   * @param branch_id - The branch identifier
   * @returns Observable with total transactions data
   */
  getTotalTransactions(branch_id: any): Observable<any> {
    if (!branch_id) {
      return throwError(() => new Error('Branch ID is required'));
    }

    return this.http.get<any>(environment.baseUrl + `/api/v1/manager/total-transactions/${branch_id}`)
      .pipe(
        timeout(30000),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Retrieves total withdrawals for a specific branch
   * @param branch_id - The branch identifier
   * @returns Observable with total withdrawals data
   */
  getTotalWithdrawals(branch_id: any): Observable<any> {
    if (!branch_id) {
      return throwError(() => new Error('Branch ID is required'));
    }

    return this.http.get<any>(environment.baseUrl + `/api/v1/manager/total-withdrawals/${branch_id}`)
      .pipe(
        timeout(30000),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Retrieves late loans for a specific branch
   * @param branch_id - The branch identifier
   * @returns Observable with late loans data
   */
  getLateLoans(branch_id: any): Observable<any> {
    if (!branch_id) {
      return throwError(() => new Error('Branch ID is required'));
    }

    return this.http.get<any>(environment.baseUrl + `/api/v1/manager/late-loans/${branch_id}`)
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
