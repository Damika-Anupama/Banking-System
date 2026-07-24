import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, retry, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { createDemoEmployee } from 'src/app/shared/demo-banking-fixtures';
import { demoStore } from 'src/app/shared/demo-store';
import { readStorage } from 'src/app/shared/safe-storage';

@Injectable({
  providedIn: 'root'
})
export class AddEmployeeService {

  constructor(private http: HttpClient) {}

  /**
   * Saves a new employee to the system
   * @param employee - Employee data to be saved
   * @returns Observable with save response
   */
  saveEmployee(employee: any): Observable<any> {
    // Input validation
    if (!employee) {
      return throwError(() => new Error('Employee data is required'));
    }
    if (!employee.email || !employee.email.includes('@')) {
      return throwError(() => new Error('Invalid email address'));
    }
    if (!employee.username || employee.username.trim().length < 3) {
      return throwError(() => new Error('Username must be at least 3 characters'));
    }
    if (!employee.password || employee.password.length < 6) {
      return throwError(() => new Error('Password must be at least 6 characters'));
    }

    if (readStorage('demoMode') === 'true') {
      const created = createDemoEmployee(employee);
      demoStore.addEmployee(created);
      return of({
        message: `Employee ${created.fullname} added successfully`,
        data: created
      }).pipe(delay(500));
    }

    return this.http.post<any>(environment.baseUrl + `/api/v1/employee`, employee)
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
