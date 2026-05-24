import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoanApprovalService {

  constructor(private http: HttpClient) {}

  /**
   * Retrieves all unapproved loans pending manager approval
   * @returns Observable with unapproved loans data
   */
  getUnapprovedLoans(): Observable<any> {
    if (localStorage.getItem('demoMode') === 'true') {
      return of({
        data: [
          { loan_basic_detail_id: 'LN-50210', amount: 750000, customer_id: 'CUS-1002', duration_days: 730, interest: 12.5, loan_type: 'Personal', status: 'Pending review', purpose: 'Home renovation' },
          { loan_basic_detail_id: 'LN-50208', amount: 1850000, customer_id: 'CUS-1003', duration_days: 1095, interest: 14.2, loan_type: 'Business', status: 'Documents verified', purpose: 'Inventory expansion' },
          { loan_basic_detail_id: 'LN-50201', amount: 420000, customer_id: 'CUS-1004', duration_days: 365, interest: 11.8, loan_type: 'Personal', status: 'Risk check', purpose: 'Education support' }
        ]
      });
    }

    return this.http.get<any>(environment.baseUrl + `/api/v1/loan/unapproved-loans`)
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
