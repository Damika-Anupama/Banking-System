import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  constructor(private http: HttpClient) { }

  /**
   * Retrieves account details for the current user
   * @returns Observable with account details
   */
  getAccountDetails(): Observable<any> {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      return throwError(() => new Error('User ID not found in local storage'));
    }

    return this.http.get<any>(environment.baseUrl + `/api/v1/transaction/pageDetails/${userId}`)
      .pipe(
        timeout(30000),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Processes a transaction between accounts
   * @param fromAccount - Source account number
   * @param toAccount - Destination account number
   * @param amount - Transaction amount
   * @param senderRemarks - Remarks from sender
   * @param beneficiaryRemarks - Remarks for beneficiary
   * @returns Observable with transaction response
   */
  proceedTransaction(fromAccount: string | number, toAccount: string | number, amount: string, senderRemarks: string, beneficiaryRemarks: string): Observable<any> {
    // Convert to string and validate
    const fromAccountStr = String(fromAccount || '').trim();
    const toAccountStr = String(toAccount || '').trim();

    // Input validation
    if (!fromAccountStr || fromAccountStr.length === 0) {
      return throwError(() => new Error('Source account is required'));
    }
    if (!toAccountStr || toAccountStr.length === 0) {
      return throwError(() => new Error('Destination account is required'));
    }
    if (fromAccountStr === toAccountStr) {
      return throwError(() => new Error('Source and destination accounts cannot be the same'));
    }
    if (!amount || parseFloat(amount) <= 0) {
      return throwError(() => new Error('Amount must be greater than zero'));
    }

    const body = {
      from_account: fromAccountStr,
      to_account: toAccountStr,
      transaction_fee: 0,
      amount: amount,
      sender_remarks: senderRemarks || '',
      beneficiary_remarks: beneficiaryRemarks || ''
    };

    return this.http.post<any>(environment.baseUrl + `/api/v1/transaction/transfer`, body)
      .pipe(
        timeout(30000),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Retrieves transaction history for a specific account
   * @param accountId - Account ID to fetch transactions for
   * @returns Observable with transaction history
   */
  getTransactions(accountId: string | number): Observable<any> {
    // Convert to string and validate
    const accountIdStr = String(accountId || '').trim();

    if (!accountIdStr || accountIdStr.length === 0) {
      return throwError(() => new Error('Account ID is required'));
    }

    return this.http.get<any>(environment.baseUrl + `/api/v1/transaction/tableDetails/${accountIdStr}`)
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
