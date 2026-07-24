/**
 * Unit Tests for UserService
 *
 * Tests all authentication, user management, and dashboard functionality
 * Target coverage: 80%+
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from 'src/environments/environment';
import { mockUser, mockAuthResponse, createMockHttpError } from 'src/testing/test-helpers';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.baseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify(); // Verify no outstanding HTTP requests
    localStorage.clear();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('authenticate()', () => {
    it('should authenticate user with valid credentials', (done) => {
      const email = 'test@example.com';
      const password = 'password123';

      service.authenticate(email, password).subscribe({
        next: (response) => {
          expect(response).toEqual(mockAuthResponse);
          expect(response.token).toBe(mockAuthResponse.token);
          expect(response.type).toBe('CUSTOMER');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/user/auth`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email, password });
      req.flush(mockAuthResponse);
    });

    it('should reject invalid email format', (done) => {
      const invalidEmail = 'not-an-email';
      const password = 'password123';

      service.authenticate(invalidEmail, password).subscribe({
        error: (error) => {
          expect(error.message).toContain('Invalid email');
          done();
        }
      });
    });

    it('should reject short password', (done) => {
      const email = 'test@example.com';
      const shortPassword = '12345'; // Less than 6 characters

      service.authenticate(email, shortPassword).subscribe({
        error: (error) => {
          expect(error.message).toContain('Invalid password');
          done();
        }
      });
    });

    it('should handle authentication failure from server', (done) => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      service.authenticate(email, password).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, so we need to handle 3 requests total
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/user/auth`);
        req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
      }
    });

    it('should handle network error', (done) => {
      const email = 'test@example.com';
      const password = 'password123';

      service.authenticate(email, password).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, so we need to handle 3 requests total
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/user/auth`);
        req.flush(null, { status: 0, statusText: 'Network Error' });
      }
    });
  });

  describe('getDashboardDetails()', () => {
    beforeEach(() => {
      localStorage.setItem('email', 'test@example.com');
    });

    it('should fetch dashboard details successfully', (done) => {
      const mockResponse = { data: [mockUser] };

      service.getDashboardDetails().subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.data[0].username).toBe('testuser');
          expect(response.data[0].accounts.length).toBe(1);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/user/dashboard/test@example.com`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should throw error if email not in localStorage', (done) => {
      localStorage.removeItem('email');

      service.getDashboardDetails().subscribe({
        error: (error) => {
          expect(error.message).toContain('email not found');
          done();
        }
      });
    });

    it('should handle 404 error', (done) => {
      service.getDashboardDetails().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, so we need to handle 3 requests total
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/user/dashboard/test@example.com`);
        req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });
      }
    });
  });

  describe('getUserDetailsById()', () => {
    it('should fetch user by id', (done) => {
      const userId = '123';
      const mockResponse = { data: mockUser };

      service.getUserDetailsById(userId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/users/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should throw error for null userId', (done) => {
      service.getUserDetailsById(null).subscribe({
        error: (error) => {
          expect(error.message).toContain('required');
          done();
        }
      });
    });
  });

  describe('getProfilePic()', () => {
    it('should fetch profile picture successfully', (done) => {
      const userIdentifier = 'user123';
      const mockResponse = {
        data: {
          picture_url: 'https://example.com/profile.jpg',
          picture_data: 'base64encodeddata'
        }
      };

      service.getProfilePic(userIdentifier).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/users/picture/${userIdentifier}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should throw error if user identifier is null', (done) => {
      service.getProfilePic(null).subscribe({
        error: (error) => {
          expect(error.message).toContain('User identifier is required');
          done();
        }
      });
    });

    it('should throw error if user identifier is empty', (done) => {
      service.getProfilePic('').subscribe({
        error: (error) => {
          expect(error.message).toContain('User identifier is required');
          done();
        }
      });
    });

    it('should handle 404 error for non-existent profile picture', (done) => {
      service.getProfilePic('user123').subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/users/picture/user123`);
        req.flush({ message: 'Profile picture not found' }, { status: 404, statusText: 'Not Found' });
      }
    });
  });

  describe('getById()', () => {
    it('should fetch user by id successfully', (done) => {
      const userId = '456';
      const mockResponse = { data: mockUser };

      service.getById(userId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/user/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should accept numeric user ID', (done) => {
      const userId = 789;
      const mockResponse = { data: mockUser };

      service.getById(userId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/user/789`);
      req.flush(mockResponse);
    });

    it('should throw error for empty string user ID', (done) => {
      service.getById('').subscribe({
        error: (error) => {
          expect(error.message).toContain('User ID is required');
          done();
        }
      });
    });

    it('should handle 404 error for non-existent user', (done) => {
      service.getById('999').subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/user/999`);
        req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });
      }
    });
  });

  describe('createAccount()', () => {
    const validAccountData = {
      uname: 'john_doe',
      email: 'john@example.com',
      contactNumber: '1234567890',
      sex: 'Male',
      pwd: 'password123'
    };

    it('should create account successfully', (done) => {
      const mockResponse = { success: true, message: 'Account created' };

      service.createAccount(
        validAccountData.uname,
        validAccountData.email,
        validAccountData.contactNumber,
        validAccountData.sex,
        validAccountData.pwd
      ).subscribe({
        next: (response) => {
          expect(response.body).toEqual(mockResponse);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/users`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.username).toBe('john_doe');
      expect(req.request.body.gender).toBe('MALE');
      expect(req.request.body.password).toBe('password123');
      req.flush(mockResponse, { status: 201, statusText: 'Created' });
    });

    it('should validate username length', (done) => {
      service.createAccount(
        'ab', // Too short
        validAccountData.email,
        validAccountData.contactNumber,
        validAccountData.sex,
        validAccountData.pwd
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('at least 3 characters');
          done();
        }
      });
    });

    it('should validate email format', (done) => {
      service.createAccount(
        validAccountData.uname,
        'invalid-email',
        validAccountData.contactNumber,
        validAccountData.sex,
        validAccountData.pwd
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Invalid email');
          done();
        }
      });
    });

    it('should validate contact number length', (done) => {
      service.createAccount(
        validAccountData.uname,
        validAccountData.email,
        '123', // Too short
        validAccountData.sex,
        validAccountData.pwd
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Invalid contact number');
          done();
        }
      });
    });

    it('should validate password length', (done) => {
      service.createAccount(
        validAccountData.uname,
        validAccountData.email,
        validAccountData.contactNumber,
        validAccountData.sex,
        '12345' // Too short
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('at least 6 characters');
          done();
        }
      });
    });

    it('should map gender correctly', (done) => {
      service.createAccount(
        validAccountData.uname,
        validAccountData.email,
        validAccountData.contactNumber,
        'Female',
        validAccountData.pwd
      ).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/api/v1/users`);
      expect(req.request.body.gender).toBe('FEMALE');
      req.flush({}, { status: 201, statusText: 'Created' });
      done();
    });

    it('should map OTHER gender correctly', (done) => {
      service.createAccount(
        validAccountData.uname,
        validAccountData.email,
        validAccountData.contactNumber,
        'Other',
        validAccountData.pwd
      ).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/api/v1/users`);
      expect(req.request.body.gender).toBe('OTHER');
      req.flush({}, { status: 201, statusText: 'Created' });
      done();
    });

    it('should map unknown gender to OTHER', (done) => {
      service.createAccount(
        validAccountData.uname,
        validAccountData.email,
        validAccountData.contactNumber,
        'Unknown',
        validAccountData.pwd
      ).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/api/v1/users`);
      expect(req.request.body.gender).toBe('OTHER');
      req.flush({}, { status: 201, statusText: 'Created' });
      done();
    });
  });

  describe('findUser()', () => {
    it('should find user by username', (done) => {
      const username = 'john_doe';
      const mockResponse = { data: [mockUser] };

      service.findUser(username).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse as any);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/users/name/${username}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should reject empty query', (done) => {
      service.findUser('   ').subscribe({
        error: (error) => {
          expect(error.message).toContain('cannot be empty');
          done();
        }
      });
    });
  });

  describe('findEmail()', () => {
    it('should find user by email', (done) => {
      const email = 'test@example.com';
      const mockResponse = { data: [mockUser] };

      service.findEmail(email).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse as any);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/users/email/${email}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should reject invalid email format', (done) => {
      service.findEmail('invalid-email').subscribe({
        error: (error) => {
          expect(error.message).toContain('Invalid email');
          done();
        }
      });
    });

    it('should reject empty email', (done) => {
      service.findEmail('').subscribe({
        error: (error) => {
          expect(error.message).toContain('Invalid email');
          done();
        }
      });
    });
  });

  describe('updateUser()', () => {
    const userId = '123';
    const userData = {
      username: 'updated_user',
      email: 'updated@example.com',
      fullname: 'Updated User',
      address: '123 Main St',
      contact_no: '9876543210',
      dob: '1990-01-01',
      gender: 'MALE'
    };

    it('should update user successfully', (done) => {
      const mockResponse = { success: true, message: 'User updated' };

      service.updateUser(userId, userData).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/user/${userId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.username).toBe('updated_user');
      req.flush(mockResponse);
    });

    it('should reject if userId is missing', (done) => {
      service.updateUser('', userData).subscribe({
        error: (error) => {
          expect(error.message).toContain('required');
          done();
        }
      });
    });

    it('should validate username length', (done) => {
      const invalidData = { ...userData, username: 'ab' };

      service.updateUser(userId, invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('at least 3 characters');
          done();
        }
      });
    });

    it('should validate email format', (done) => {
      const invalidData = { ...userData, email: 'invalid' };

      service.updateUser(userId, invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Invalid email');
          done();
        }
      });
    });
  });

  describe('sendVerificationCode()', () => {
    it('should send verification code successfully', (done) => {
      const code = 123456;
      const email = 'test@example.com';
      const mockResponse = { success: true };

      service.sendVerificationCode(code, email).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/mails/sendMail`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.recipient).toBe(email);
      expect(req.request.body.msgBody).toBe(code);
      expect(req.request.body.subject).toContain('Verification Code');
      req.flush(mockResponse);
    });

    it('should reject invalid email', (done) => {
      service.sendVerificationCode(123456, 'invalid').subscribe({
        error: (error) => {
          expect(error.message).toContain('Invalid email');
          done();
        }
      });
    });

    it('should reject invalid verification code', (done) => {
      service.sendVerificationCode(-1, 'test@example.com').subscribe({
        error: (error) => {
          expect(error.message).toContain('Invalid verification code');
          done();
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should log errors to console', (done) => {
      spyOn(console, 'error');
      const email = 'test@example.com';
      const password = 'password123';

      service.authenticate(email, password).subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalled();
          done();
        }
      });

      // Trigger an error by returning 500
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/user/auth`);
        req.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });
      }
    });

    it('should handle 500 server errors', (done) => {
      localStorage.setItem('email', 'test@example.com');

      service.getDashboardDetails().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, so we need to handle 3 requests total
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/user/dashboard/test@example.com`);
        req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Server Error' });
      }
    });

    it('should handle client-side ErrorEvent', (done) => {
      const email = 'test@example.com';
      const password = 'password123';

      service.authenticate(email, password).subscribe({
        error: (error) => {
          expect(error.message).toContain('Error: Test client error');
          done();
        }
      });

      // Trigger client-side error with ErrorEvent
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/user/auth`);
        req.error(new ErrorEvent('Network error', {
          message: 'Test client error'
        }));
      }
    });
  });
});
