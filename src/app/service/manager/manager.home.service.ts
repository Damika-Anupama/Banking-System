import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
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
    if (localStorage.getItem('demoMode') === 'true') {
      return of({
        data: [{
          user_id: 'MGR-1001',
          branch_id: 'BR-001',
          branch_name: 'Colombo Main Branch',
          manager_id: 'MAN-502',
          num_accounts: 1284,
          num_employees: 24
        }]
      });
    }

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
    if (localStorage.getItem('demoMode') === 'true') {
      return of({
        result: [
          { transfer_id: 'TRX-90821', amount: 185000, from_account: 'ACC-492810', to_account: 'ACC-772901', transferd_time: '2026-05-24T09:40:00', direction: 'up' },
          { transfer_id: 'TRX-90818', amount: 64000,  from_account: 'ACC-118209', to_account: 'ACC-492811', transferd_time: '2026-05-24T08:15:00', direction: 'up' },
          { transfer_id: 'TRX-90812', amount: 42000,  from_account: 'ACC-492812', to_account: 'ACC-560010', transferd_time: '2026-05-23T16:30:00', direction: 'down' },
          { transfer_id: 'TRX-90796', amount: 12500,  from_account: 'ACC-300871', to_account: 'ACC-300871', transferd_time: '2026-05-23T12:05:00', direction: 'no-change' },
          { transfer_id: 'TRX-90781', amount: 310000, from_account: 'ACC-660412', to_account: 'ACC-492812', transferd_time: '2026-05-23T09:00:00', direction: 'up' },
          { transfer_id: 'TRX-90754', amount: 75000,  from_account: 'ACC-492810', to_account: 'ACC-492811', transferd_time: '2026-05-22T14:50:00', direction: 'down' },
          { transfer_id: 'TRX-90741', amount: 93000,  from_account: 'ACC-229180', to_account: 'ACC-492811', transferd_time: '2026-05-22T10:20:00', direction: 'up' },
          { transfer_id: 'TRX-90729', amount: 18500,  from_account: 'ACC-492811', to_account: 'ACC-880021', transferd_time: '2026-05-21T16:10:00', direction: 'down' },
          { transfer_id: 'TRX-90712', amount: 56000,  from_account: 'ACC-492812', to_account: 'ACC-335500', transferd_time: '2026-05-21T11:35:00', direction: 'down' },
          { transfer_id: 'TRX-90698', amount: 27500,  from_account: 'ACC-770814', to_account: 'ACC-492810', transferd_time: '2026-05-20T15:00:00', direction: 'up' }
        ]
      });
    }

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
    if (localStorage.getItem('demoMode') === 'true') {
      return of([
        { withdrawal_id: 'WDR-33014', amount: 25000,  account_id: 'ACC-492810', withdrawal_time: '2026-05-24T10:15:00' },
        { withdrawal_id: 'WDR-33009', amount: 80000,  account_id: 'ACC-118209', withdrawal_time: '2026-05-23T15:45:00' },
        { withdrawal_id: 'WDR-32998', amount: 12000,  account_id: 'ACC-772901', withdrawal_time: '2026-05-22T11:10:00' },
        { withdrawal_id: 'WDR-32985', amount: 50000,  account_id: 'ACC-492812', withdrawal_time: '2026-05-21T14:30:00' },
        { withdrawal_id: 'WDR-32971', amount: 8500,   account_id: 'ACC-229180', withdrawal_time: '2026-05-21T09:50:00' },
        { withdrawal_id: 'WDR-32960', amount: 150000, account_id: 'ACC-660412', withdrawal_time: '2026-05-20T16:00:00' },
        { withdrawal_id: 'WDR-32947', amount: 35000,  account_id: 'ACC-492810', withdrawal_time: '2026-05-19T11:25:00' }
      ]);
    }

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
    if (localStorage.getItem('demoMode') === 'true') {
      return of([
        { installment_id: 'INS-7102', installment_number: 7,  due_date: '2026-05-12', amount: 38000, loan_basic_detail_id: 'LN-40012' },
        { installment_id: 'INS-7091', installment_number: 4,  due_date: '2026-05-15', amount: 62500, loan_basic_detail_id: 'LN-40008' },
        { installment_id: 'INS-7066', installment_number: 11, due_date: '2026-05-18', amount: 22500, loan_basic_detail_id: 'LN-39971' },
        { installment_id: 'INS-7048', installment_number: 2,  due_date: '2026-05-20', amount: 45000, loan_basic_detail_id: 'LN-39955' },
        { installment_id: 'INS-7031', installment_number: 8,  due_date: '2026-05-22', amount: 18750, loan_basic_detail_id: 'LN-39940' }
      ]);
    }

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
