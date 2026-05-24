import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {catchError, retry, timeout} from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeHomeService {

  constructor(private http: HttpClient) {
  }

  /**
   * Retrieves employee home dashboard data
   * @returns Observable with employee home data
   */
  getEmployeeHome(): Observable<any> {
    if (localStorage.getItem('demoMode') === 'true') {
      return of({
        data: [
          { user_id: 'CUS-1001', username: 'amara.perera', fullname: 'Amara Perera', gender: 'Female', dob: '1991-04-18', address: 'No. 24, Marine Drive, Colombo 03', email: 'amara@banking.demo', contact_no: '+94 77 123 4567', account_count: 3, status: 'KYC verified' },
          { user_id: 'CUS-1002', username: 'nuwan.silva', fullname: 'Nuwan Silva', gender: 'Male', dob: '1988-09-02', address: 'Lake Road, Kandy', email: 'nuwan@banking.demo', contact_no: '+94 71 555 0199', account_count: 2, status: 'Loan review' },
          { user_id: 'CUS-1003', username: 'sofia.fernando', fullname: 'Sofia Fernando', gender: 'Female', dob: '1995-12-11', address: 'Galle Fort, Galle', email: 'sofia@banking.demo', contact_no: '+94 76 222 8899', account_count: 4, status: 'Priority customer' },
          { user_id: 'CUS-1004', username: 'ishan.jay', fullname: 'Ishan Jayawardena', gender: 'Male', dob: '1984-06-25', address: 'Negombo Road, Wattala', email: 'ishan@banking.demo', contact_no: '+94 70 445 7812', account_count: 1, status: 'New onboarding' }
        ]
      });
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get(`${environment.baseUrl}/api/v1/employee/home`, {headers})
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
