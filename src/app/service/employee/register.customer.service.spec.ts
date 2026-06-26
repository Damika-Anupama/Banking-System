/**
 * Unit Tests for RegisterCustomerService
 *
 * Tests customer registration, validation, and error handling
 * Target coverage: 90%+
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RegisterCustomerService } from './register.customer.service';
import { environment } from 'src/environments/environment';

describe('RegisterCustomerService', () => {
  let service: RegisterCustomerService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.baseUrl;

  const validCustomerData = {
    username: 'johndoe',
    email: 'john.doe@example.com',
    password: 'password123',
    fullname: 'John Doe',
    contact_no: '1234567890',
    gender: 'MALE',
    dob: '1990-01-01',
    address: '123 Main St'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RegisterCustomerService]
    });

    service = TestBed.inject(RegisterCustomerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify no outstanding HTTP requests
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('registerCustomer()', () => {
    it('should register customer successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Customer registered successfully',
        customer_id: 'CUST001'
      };

      service.registerCustomer(validCustomerData).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.success).toBe(true);
          expect(response.customer_id).toBe('CUST001');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/user`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.body).toEqual(validCustomerData);
      req.flush(mockResponse);
    });

    it('should include correct headers in request', (done) => {
      service.registerCustomer(validCustomerData).subscribe({
        next: () => {
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/user`);
      expect(req.request.headers.has('Content-Type')).toBe(true);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush({ success: true });
    });

    it('should validate registration data is required', (done) => {
      service.registerCustomer(null).subscribe({
        error: (error) => {
          expect(error.message).toContain('Registration data is required');
          done();
        }
      });
    });

    it('should reject undefined registration data', (done) => {
      service.registerCustomer(undefined).subscribe({
        error: (error) => {
          expect(error.message).toContain('Registration data is required');
          done();
        }
      });
    });

    it('should validate email is required', (done) => {
      const invalidData = { ...validCustomerData, email: '' };

      service.registerCustomer(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Invalid email');
          done();
        }
      });
    });

    it('should validate email format', (done) => {
      const invalidData = { ...validCustomerData, email: 'invalid-email' };

      service.registerCustomer(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Invalid email');
          done();
        }
      });
    });

    it('should reject email without @ symbol', (done) => {
      const invalidData = { ...validCustomerData, email: 'notanemail.com' };

      service.registerCustomer(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Invalid email');
          done();
        }
      });
    });

    it('should reject null email', (done) => {
      const invalidData = { ...validCustomerData, email: null };

      service.registerCustomer(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Invalid email');
          done();
        }
      });
    });

    it('should validate username is required', (done) => {
      const invalidData = { ...validCustomerData, username: '' };

      service.registerCustomer(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Username must be at least 3 characters');
          done();
        }
      });
    });

    it('should validate username minimum length', (done) => {
      const invalidData = { ...validCustomerData, username: 'ab' };

      service.registerCustomer(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Username must be at least 3 characters');
          done();
        }
      });
    });

    it('should trim whitespace from username before validation', (done) => {
      const invalidData = { ...validCustomerData, username: '  ab  ' };

      service.registerCustomer(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Username must be at least 3 characters');
          done();
        }
      });
    });

    it('should accept username with exactly 3 characters', (done) => {
      const validData = { ...validCustomerData, username: 'abc' };
      const mockResponse = { success: true };

      service.registerCustomer(validData).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/user`);
      req.flush(mockResponse);
    });

    it('should reject null username', (done) => {
      const invalidData = { ...validCustomerData, username: null };

      service.registerCustomer(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Username must be at least 3 characters');
          done();
        }
      });
    });

    it('should validate password is required', (done) => {
      const invalidData = { ...validCustomerData, password: '' };

      service.registerCustomer(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Password must be at least 6 characters');
          done();
        }
      });
    });

    it('should validate password minimum length', (done) => {
      const invalidData = { ...validCustomerData, password: '12345' };

      service.registerCustomer(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Password must be at least 6 characters');
          done();
        }
      });
    });

    it('should accept password with exactly 6 characters', (done) => {
      const validData = { ...validCustomerData, password: '123456' };
      const mockResponse = { success: true };

      service.registerCustomer(validData).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/user`);
      req.flush(mockResponse);
    });

    it('should reject null password', (done) => {
      const invalidData = { ...validCustomerData, password: null };

      service.registerCustomer(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Password must be at least 6 characters');
          done();
        }
      });
    });

    it('should accept long password', (done) => {
      const validData = { ...validCustomerData, password: 'VeryLongSecurePassword123!' };
      const mockResponse = { success: true };

      service.registerCustomer(validData).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/user`);
      req.flush(mockResponse);
    });

    it('should accept valid email with subdomain', (done) => {
      const validData = { ...validCustomerData, email: 'user@mail.example.com' };
      const mockResponse = { success: true };

      service.registerCustomer(validData).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/user`);
      req.flush(mockResponse);
    });

    it('should handle duplicate email error', (done) => {
      service.registerCustomer(validCustomerData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Email already exists');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/user`);
        req.flush({ message: 'Email already exists' }, { status: 409, statusText: 'Conflict' });
      }
    });

    it('should handle duplicate username error', (done) => {
      service.registerCustomer(validCustomerData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Username already exists');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/user`);
        req.flush({ message: 'Username already exists' }, { status: 409, statusText: 'Conflict' });
      }
    });

    it('should handle bad request error (400)', (done) => {
      service.registerCustomer(validCustomerData).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/user`);
        req.flush({ message: 'Invalid registration data' }, { status: 400, statusText: 'Bad Request' });
      }
    });

    it('should handle unauthorized error (401)', (done) => {
      service.registerCustomer(validCustomerData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Unauthorized');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/user`);
        req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
      }
    });

    it('should handle forbidden error (403)', (done) => {
      service.registerCustomer(validCustomerData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Forbidden');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/user`);
        req.flush({ message: 'Forbidden - insufficient permissions' }, { status: 403, statusText: 'Forbidden' });
      }
    });

    it('should handle server error (500)', (done) => {
      service.registerCustomer(validCustomerData).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/user`);
        req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Server Error' });
      }
    });

    it('should handle network error', (done) => {
      service.registerCustomer(validCustomerData).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/user`);
        req.flush(null, { status: 0, statusText: 'Network Error' });
      }
    });

    it('should handle timeout error', (done) => {
      service.registerCustomer(validCustomerData).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/user`);
        req.flush({ message: 'Request timeout' }, { status: 408, statusText: 'Request Timeout' });
      }
    });
  });

  describe('Error Handling', () => {
    it('should log errors to console', (done) => {
      spyOn(console, 'error');

      service.registerCustomer(validCustomerData).subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalled();
          done();
        }
      });

      // Trigger error
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/user`);
        req.flush({ message: 'Error' }, { status: 500, statusText: 'Error' });
      }
    });

    it('should format error messages correctly', (done) => {
      service.registerCustomer(validCustomerData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Test error message');
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/user`);
        req.flush({ message: 'Test error message' }, { status: 400, statusText: 'Bad Request' });
      }
    });

    it('should handle client-side errors', (done) => {
      service.registerCustomer(validCustomerData).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Trigger client-side error by simulating network failure
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/user`);
        req.error(new ErrorEvent('Network error', {
          message: 'Network connection failed'
        }));
      }
    });

    it('should handle server error without message', (done) => {
      service.registerCustomer(validCustomerData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Server returned code 500');
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/user`);
        req.flush({}, { status: 500, statusText: 'Server Error' });
      }
    });
  });

  describe('Validation Edge Cases', () => {
    it('should handle whitespace-only username', (done) => {
      const invalidData = { ...validCustomerData, username: '   ' };

      service.registerCustomer(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Username must be at least 3 characters');
          done();
        }
      });
    });

    it('should accept username with spaces after trimming', (done) => {
      const validData = { ...validCustomerData, username: '  john doe  ' };
      const mockResponse = { success: true };

      service.registerCustomer(validData).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/user`);
      req.flush(mockResponse);
    });

    it('should handle special characters in email', (done) => {
      const validData = { ...validCustomerData, email: 'user+test@example.com' };
      const mockResponse = { success: true };

      service.registerCustomer(validData).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/user`);
      req.flush(mockResponse);
    });

    it('should handle numbers in username', (done) => {
      const validData = { ...validCustomerData, username: 'user123' };
      const mockResponse = { success: true };

      service.registerCustomer(validData).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/user`);
      req.flush(mockResponse);
    });

    it('should handle special characters in password', (done) => {
      const validData = { ...validCustomerData, password: 'P@ssw0rd!' };
      const mockResponse = { success: true };

      service.registerCustomer(validData).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/user`);
      req.flush(mockResponse);
    });
  });
});
