/**
 * Unit Tests for AddEmployeeService
 *
 * Tests employee registration, validation, and error handling
 * Target coverage: 90%+
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AddEmployeeService } from './add.employee.service';
import { environment } from 'src/environments/environment';

describe('AddEmployeeService', () => {
  let service: AddEmployeeService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.baseUrl;

  const validEmployeeData = {
    username: 'employeeuser',
    email: 'employee@example.com',
    password: 'password123',
    fullname: 'Employee Name',
    contact_no: '9876543210',
    gender: 'MALE',
    branch_id: 'BR001',
    role: 'EMPLOYEE'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AddEmployeeService]
    });

    service = TestBed.inject(AddEmployeeService);
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

  describe('saveEmployee()', () => {
    it('should save employee successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Employee saved successfully',
        employee_id: 'EMP001'
      };

      service.saveEmployee(validEmployeeData).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.success).toBe(true);
          expect(response.employee_id).toBe('EMP001');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(validEmployeeData);
      req.flush(mockResponse);
    });

    it('should validate employee data is required', (done) => {
      service.saveEmployee(null).subscribe({
        error: (error) => {
          expect(error.message).toContain('Employee data is required');
          done();
        }
      });
    });

    it('should reject undefined employee data', (done) => {
      service.saveEmployee(undefined).subscribe({
        error: (error) => {
          expect(error.message).toContain('Employee data is required');
          done();
        }
      });
    });

    it('should validate email is required', (done) => {
      const invalidData = { ...validEmployeeData, email: '' };

      service.saveEmployee(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Invalid email');
          done();
        }
      });
    });

    it('should validate email format', (done) => {
      const invalidData = { ...validEmployeeData, email: 'invalid-email' };

      service.saveEmployee(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Invalid email');
          done();
        }
      });
    });

    it('should reject email without @ symbol', (done) => {
      const invalidData = { ...validEmployeeData, email: 'notanemail.com' };

      service.saveEmployee(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Invalid email');
          done();
        }
      });
    });

    it('should reject null email', (done) => {
      const invalidData = { ...validEmployeeData, email: null };

      service.saveEmployee(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Invalid email');
          done();
        }
      });
    });

    it('should validate username is required', (done) => {
      const invalidData = { ...validEmployeeData, username: '' };

      service.saveEmployee(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Username must be at least 3 characters');
          done();
        }
      });
    });

    it('should validate username minimum length', (done) => {
      const invalidData = { ...validEmployeeData, username: 'ab' };

      service.saveEmployee(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Username must be at least 3 characters');
          done();
        }
      });
    });

    it('should trim whitespace from username before validation', (done) => {
      const invalidData = { ...validEmployeeData, username: '  xy  ' };

      service.saveEmployee(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Username must be at least 3 characters');
          done();
        }
      });
    });

    it('should accept username with exactly 3 characters', (done) => {
      const validData = { ...validEmployeeData, username: 'emp' };
      const mockResponse = { success: true };

      service.saveEmployee(validData).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
      req.flush(mockResponse);
    });

    it('should reject null username', (done) => {
      const invalidData = { ...validEmployeeData, username: null };

      service.saveEmployee(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Username must be at least 3 characters');
          done();
        }
      });
    });

    it('should validate password is required', (done) => {
      const invalidData = { ...validEmployeeData, password: '' };

      service.saveEmployee(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Password must be at least 6 characters');
          done();
        }
      });
    });

    it('should validate password minimum length', (done) => {
      const invalidData = { ...validEmployeeData, password: '12345' };

      service.saveEmployee(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Password must be at least 6 characters');
          done();
        }
      });
    });

    it('should accept password with exactly 6 characters', (done) => {
      const validData = { ...validEmployeeData, password: '123456' };
      const mockResponse = { success: true };

      service.saveEmployee(validData).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
      req.flush(mockResponse);
    });

    it('should reject null password', (done) => {
      const invalidData = { ...validEmployeeData, password: null };

      service.saveEmployee(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Password must be at least 6 characters');
          done();
        }
      });
    });

    it('should accept long password', (done) => {
      const validData = { ...validEmployeeData, password: 'VeryLongSecurePassword123!' };
      const mockResponse = { success: true };

      service.saveEmployee(validData).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
      req.flush(mockResponse);
    });

    it('should accept valid email with subdomain', (done) => {
      const validData = { ...validEmployeeData, email: 'emp@mail.company.com' };
      const mockResponse = { success: true };

      service.saveEmployee(validData).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
      req.flush(mockResponse);
    });

    it('should handle duplicate email error', (done) => {
      service.saveEmployee(validEmployeeData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Email already exists');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
        req.flush({ message: 'Email already exists' }, { status: 409, statusText: 'Conflict' });
      }
    });

    it('should handle duplicate username error', (done) => {
      service.saveEmployee(validEmployeeData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Username already exists');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
        req.flush({ message: 'Username already exists' }, { status: 409, statusText: 'Conflict' });
      }
    });

    it('should handle bad request error (400)', (done) => {
      service.saveEmployee(validEmployeeData).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
        req.flush({ message: 'Invalid employee data' }, { status: 400, statusText: 'Bad Request' });
      }
    });

    it('should handle unauthorized error (401)', (done) => {
      service.saveEmployee(validEmployeeData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Unauthorized');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
        req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
      }
    });

    it('should handle forbidden error (403)', (done) => {
      service.saveEmployee(validEmployeeData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Forbidden');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
        req.flush({ message: 'Forbidden - insufficient permissions' }, { status: 403, statusText: 'Forbidden' });
      }
    });

    it('should handle server error (500)', (done) => {
      service.saveEmployee(validEmployeeData).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
        req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Server Error' });
      }
    });

    it('should handle network error', (done) => {
      service.saveEmployee(validEmployeeData).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
        req.flush(null, { status: 0, statusText: 'Network Error' });
      }
    });

    it('should handle timeout error', (done) => {
      service.saveEmployee(validEmployeeData).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
        req.flush({ message: 'Request timeout' }, { status: 408, statusText: 'Request Timeout' });
      }
    });
  });

  describe('Error Handling', () => {
    it('should log errors to console', (done) => {
      spyOn(console, 'error');

      service.saveEmployee(validEmployeeData).subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalled();
          done();
        }
      });

      // Trigger error
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
        req.flush({ message: 'Error' }, { status: 500, statusText: 'Error' });
      }
    });

    it('should format error messages correctly', (done) => {
      service.saveEmployee(validEmployeeData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Test error message');
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
        req.flush({ message: 'Test error message' }, { status: 400, statusText: 'Bad Request' });
      }
    });

    it('should handle client-side errors', (done) => {
      service.saveEmployee(validEmployeeData).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Trigger client-side error by simulating network failure
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
        req.error(new ErrorEvent('Network error', {
          message: 'Network connection failed'
        }));
      }
    });

    it('should handle server error without message', (done) => {
      service.saveEmployee(validEmployeeData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Server returned code 500');
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
        req.flush({}, { status: 500, statusText: 'Server Error' });
      }
    });
  });

  describe('Validation Edge Cases', () => {
    it('should handle whitespace-only username', (done) => {
      const invalidData = { ...validEmployeeData, username: '   ' };

      service.saveEmployee(invalidData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Username must be at least 3 characters');
          done();
        }
      });
    });

    it('should accept username with spaces after trimming', (done) => {
      const validData = { ...validEmployeeData, username: '  emp user  ' };
      const mockResponse = { success: true };

      service.saveEmployee(validData).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
      req.flush(mockResponse);
    });

    it('should handle special characters in email', (done) => {
      const validData = { ...validEmployeeData, email: 'emp+test@example.com' };
      const mockResponse = { success: true };

      service.saveEmployee(validData).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
      req.flush(mockResponse);
    });

    it('should handle numbers in username', (done) => {
      const validData = { ...validEmployeeData, username: 'emp123' };
      const mockResponse = { success: true };

      service.saveEmployee(validData).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
      req.flush(mockResponse);
    });

    it('should handle special characters in password', (done) => {
      const validData = { ...validEmployeeData, password: 'P@ssw0rd!' };
      const mockResponse = { success: true };

      service.saveEmployee(validData).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
      req.flush(mockResponse);
    });

    it('should handle employee with all optional fields', (done) => {
      const completeData = {
        ...validEmployeeData,
        address: '456 Business St',
        dob: '1985-06-15',
        department: 'Finance'
      };
      const mockResponse = { success: true };

      service.saveEmployee(completeData).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/employee`);
      expect(req.request.body).toEqual(completeData);
      req.flush(mockResponse);
    });
  });
});
