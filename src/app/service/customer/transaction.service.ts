import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
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
    if (localStorage.getItem('demoMode') === 'true') {
      return of({
        data: [
          { account_id: 'ACC-492810', account_type: 'PERSONAL', saving_type: 'SAVING', branch_name: 'Colombo Main Branch', amount: '1245800' },
          { account_id: 'ACC-492811', account_type: 'PERSONAL', saving_type: 'CURRENT', branch_name: 'Colombo Main Branch', amount: '485250' },
          { account_id: 'ACC-492812', account_type: 'ORGANIZATION', saving_type: 'SAVING', branch_name: 'Kandy City Branch', amount: '2000000' }
        ]
      });
    }

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

    if (localStorage.getItem('demoMode') === 'true') {
      return of({
        message: 'Transfer created successfully!',
        reference: 'TRX-DEMO-' + Date.now(),
        data: body
      });
    }

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

    if (localStorage.getItem('demoMode') === 'true') {
      const demoTransactions: Record<string, any[]> = {
        'ACC-492810': [
          { date: '2026-05-24T09:40:00', type: 'Salary Credit', sender_remarks: 'Monthly payroll received', amount: 185000, status: 'up' },
          { date: '2026-05-23T14:20:00', type: 'Utility Payment', sender_remarks: 'Electricity and water bill', amount: 18500, status: 'down' },
          { date: '2026-05-22T11:05:00', type: 'Card Settlement', sender_remarks: 'Supermarket purchase', amount: 9450, status: 'down' }
        ],
        'ACC-492811': [
          { date: '2026-05-24T08:15:00', type: 'Client Transfer', sender_remarks: 'Invoice BS-1024 paid', amount: 64000, status: 'up' },
          { date: '2026-05-21T16:10:00', type: 'Vendor Payment', sender_remarks: 'Office equipment supplier', amount: 42000, status: 'down' }
        ],
        'ACC-492812': [
          { date: '2026-05-20T10:00:00', type: 'Fixed Deposit Interest', sender_remarks: 'Quarterly interest posting', amount: 31500, status: 'up' },
          { date: '2026-05-18T13:25:00', type: 'Internal Transfer', sender_remarks: 'Moved to savings account', amount: 50000, status: 'down' }
        ]
      };

      return of({ data: demoTransactions[accountIdStr] || [] });
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
