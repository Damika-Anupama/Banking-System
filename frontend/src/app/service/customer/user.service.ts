import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, retry, timeout} from 'rxjs/operators';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {
  }

  /**
   * Sends a verification code email to the user
   * @param num - The verification code to send
   * @param email - The recipient's email address
   * @returns Observable with the email sending response
   */
  sendVerificationCode(num: number, email: string): Observable<any> {
    if (!email || !email.includes('@')) {
      return throwError(() => new Error('Invalid email address'));
    }
    if (!num || num < 0) {
      return throwError(() => new Error('Invalid verification code'));
    }

    const body = {
      recipient: email,
      msgBody: num,
      subject: 'Verification Code - Palindrome Sign-up',
    };

    return this.http.post(environment.baseUrl + `/api/v1/mails/sendMail`, body)
      .pipe(
        timeout(30000),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Creates a new user account
   * @param uname - Username for the new account
   * @param email - Email address
   * @param contactNumber - Contact phone number
   * @param sex - Gender (Male/Female/Other)
   * @param pwd - Password
   * @returns Observable with the account creation response
   */
  createAccount(uname: string, email: string, contactNumber: string, sex: string, pwd: string): Observable<HttpResponse<any>> {
    // Input validation
    if (!uname || uname.trim().length < 3) {
      return throwError(() => new Error('Username must be at least 3 characters'));
    }
    if (!email || !email.includes('@')) {
      return throwError(() => new Error('Invalid email address'));
    }
    if (!contactNumber || contactNumber.trim().length < 10) {
      return throwError(() => new Error('Invalid contact number'));
    }
    if (!pwd || pwd.length < 6) {
      return throwError(() => new Error('Password must be at least 6 characters'));
    }

    let gender: string;
    if (sex === 'Male') {
      gender = 'MALE';
    } else if (sex === 'Female') {
      gender = 'FEMALE';
    } else {
      gender = 'OTHER';
    }

    const body = {
      username: uname,
      password: pwd,
      role: 'USER',
      email,
      gender,
      shortDescription: 'Hello, I\'m a newbie 🐰',
      contactNum: contactNumber
    };

    return this.http.post<HttpResponse<any>>(environment.baseUrl + `/api/v1/users`, body, {
      observe: 'response'
    }).pipe(
      timeout(30000),
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * Finds a user by username
   * @param query - Username to search for
   * @returns Observable with the user search result
   */
  findUser(query: string): Observable<string> {
    if (!query || query.trim().length === 0) {
      return throwError(() => new Error('Search query cannot be empty'));
    }

    return this.http.get<string>(environment.baseUrl + `/api/v1/users/name/` + query)
      .pipe(
        timeout(30000),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Finds a user by email address
   * @param query - Email address to search for
   * @returns Observable with the email search result
   */
  findEmail(query: string): Observable<string> {
    if (!query || query.trim().length === 0 || !query.includes('@')) {
      return throwError(() => new Error('Invalid email query'));
    }

    return this.http.get<string>(environment.baseUrl + `/api/v1/users/email/` + query)
      .pipe(
        timeout(30000),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Retrieves user details by user ID
   * @param query - User ID
   * @returns Observable with user details
   */
  getUserDetailsById(query: string | null): Observable<any> {
    if (!query) {
      return throwError(() => new Error('User ID is required'));
    }

    return this.http.get<any>(environment.baseUrl + `/api/v1/users/${query}`)
      .pipe(
        timeout(30000),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Retrieves user profile picture
   * @param query - User identifier
   * @returns Observable with profile picture data
   */
  getProfilePic(query: string | null): Observable<any> {
    if (!query) {
      return throwError(() => new Error('User identifier is required'));
    }

    return this.http.get<any>(environment.baseUrl + `/api/v1/users/picture/` + query)
      .pipe(
        timeout(30000),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Retrieves dashboard details for the current user
   * @returns Observable with dashboard data
   */
  getDashboardDetails(): Observable<any> {
    const email = localStorage.getItem('email');
    if (!email) {
      return throwError(() => new Error('User email not found in local storage'));
    }

    return this.http.get<any>(environment.baseUrl + `/api/v1/user/dashboard/${email}`)
      .pipe(
        timeout(30000),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Authenticates a user with email and password
   * @param email - User email address
   * @param password - User password
   * @returns Observable with authentication response
   */
  authenticate(email: string, password: string): Observable<any> {
    if (!email || !email.includes('@')) {
      return throwError(() => new Error('Invalid email address'));
    }
    if (!password || password.length < 6) {
      return throwError(() => new Error('Invalid password'));
    }

    const body = {
      email,
      password
    };

    return this.http.post<any>(environment.baseUrl + `/api/v1/user/auth`, body)
      .pipe(
        timeout(30000),
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Get user by ID
   * @param userId - User ID
   * @returns Observable with user data
   */
  getById(userId: string | number): Observable<any> {
    const userIdStr = String(userId);

    if (!userIdStr) {
      return throwError(() => new Error('User ID is required'));
    }

    return this.http.get(environment.baseUrl + `/api/v1/user/${userIdStr}`).pipe(
      timeout(30000),
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * Updates user profile information
   * @param userId - User ID
   * @param userData - User data object containing fields to update
   * @returns Observable with update response
   */
  updateUser(userId: string | number, userData: any): Observable<any> {
    const userIdStr = String(userId);

    if (!userIdStr) {
      return throwError(() => new Error('User ID is required'));
    }
    if (!userData.username || userData.username.trim().length < 3) {
      return throwError(() => new Error('Username must be at least 3 characters'));
    }
    if (!userData.email || !userData.email.includes('@')) {
      return throwError(() => new Error('Invalid email address'));
    }

    const body = {
      username: userData.username,
      email: userData.email,
      fullname: userData.fullname || '',
      address: userData.address || '',
      contact_no: userData.contact_no || '',
      dob: userData.dob || '',
      gender: userData.gender || '',
      password: userData.password || '' // Optional - only if changing password
    };

    return this.http.put(environment.baseUrl + `/api/v1/user/${userIdStr}`, body).pipe(
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

    // Debug logging
    console.error('Full error object:', error);
    console.error('Error status:', error.status);
    console.error('Error statusText:', error.statusText);
    console.error('Error url:', error.url);
    console.error('Error error:', error.error);

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.status === 0) {
      // Status 0 means network error or CORS issue
      errorMessage = 'Network error - Unable to reach server. Please check if the backend is running on http://localhost:3000';
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Server returned code ${error.status}`;
    }

    console.error('Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}// Force recompile
