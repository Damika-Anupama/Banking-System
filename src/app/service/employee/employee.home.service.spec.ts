/**
 * Unit Tests for EmployeeHomeService
 *
 * Tests employee dashboard data retrieval and error handling
 * Target coverage: 90%+
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EmployeeHomeService } from './employee.home.service';
import { environment } from 'src/environments/environment';

describe('EmployeeHomeService', () => {
  let service: EmployeeHomeService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.baseUrl;

  const mockEmployeeHomeData = {
    employee_id: 'EMP001',
    employee_name: 'John Smith',
    branch_name: 'Main Branch',
    pending_approvals: 5,
    recent_customers: [
      {
        customer_id: 'CUST001',
        name: 'Alice Johnson',
        account_type: 'SAVINGS',
        status: 'ACTIVE'
      }
    ],
    statistics: {
      total_customers: 150,
      new_accounts_today: 3,
      pending_loans: 8,
      pending_fds: 2
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EmployeeHomeService]
    });

    service = TestBed.inject(EmployeeHomeService);
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

  describe('getEmployeeHome()', () => {
    it('should fetch employee home data successfully', (done) => {
      const mockResponse = { data: mockEmployeeHomeData };

      service.getEmployeeHome().subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.data.employee_id).toBe('EMP001');
          expect(response.data.pending_approvals).toBe(5);
          expect(response.data.statistics.total_customers).toBe(150);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/employee/home`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(mockResponse);
    });

    it('should include correct headers in request', (done) => {
      service.getEmployeeHome().subscribe({
        next: () => {
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/employee/home`);
      expect(req.request.headers.has('Content-Type')).toBe(true);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush({ data: mockEmployeeHomeData });
    });

    it('should handle empty dashboard data', (done) => {
      const emptyResponse = {
        data: {
          pending_approvals: 0,
          recent_customers: [],
          statistics: {
            total_customers: 0,
            new_accounts_today: 0,
            pending_loans: 0,
            pending_fds: 0
          }
        }
      };

      service.getEmployeeHome().subscribe({
        next: (response) => {
          expect(response.data.pending_approvals).toBe(0);
          expect(response.data.recent_customers.length).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/employee/home`);
      req.flush(emptyResponse);
    });

    it('should handle unauthorized error (401)', (done) => {
      service.getEmployeeHome().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          expect(error.message).toContain('Unauthorized');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee/home`);
        req.flush({ message: 'Unauthorized access' }, { status: 401, statusText: 'Unauthorized' });
      }
    });

    it('should handle forbidden error (403)', (done) => {
      service.getEmployeeHome().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          expect(error.message).toContain('Forbidden');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee/home`);
        req.flush({ message: 'Forbidden - insufficient permissions' }, { status: 403, statusText: 'Forbidden' });
      }
    });

    it('should handle not found error (404)', (done) => {
      service.getEmployeeHome().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee/home`);
        req.flush({ message: 'Employee data not found' }, { status: 404, statusText: 'Not Found' });
      }
    });

    it('should handle server error (500)', (done) => {
      service.getEmployeeHome().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee/home`);
        req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Server Error' });
      }
    });

    it('should handle network error', (done) => {
      service.getEmployeeHome().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee/home`);
        req.flush(null, { status: 0, statusText: 'Network Error' });
      }
    });

    it('should handle timeout error', (done) => {
      service.getEmployeeHome().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee/home`);
        req.flush({ message: 'Request timeout' }, { status: 408, statusText: 'Request Timeout' });
      }
    });

    it('should handle service unavailable error (503)', (done) => {
      service.getEmployeeHome().subscribe({
        error: (error) => {
          expect(error.message).toContain('Service Unavailable');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee/home`);
        req.flush({ message: 'Service Unavailable' }, { status: 503, statusText: 'Service Unavailable' });
      }
    });
  });

  describe('Error Handling', () => {
    it('should log errors to console', (done) => {
      spyOn(console, 'error');

      service.getEmployeeHome().subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalled();
          done();
        }
      });

      // Trigger error
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee/home`);
        req.flush({ message: 'Error' }, { status: 500, statusText: 'Error' });
      }
    });

    it('should format error messages correctly', (done) => {
      service.getEmployeeHome().subscribe({
        error: (error) => {
          expect(error.message).toContain('Test error message');
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee/home`);
        req.flush({ message: 'Test error message' }, { status: 400, statusText: 'Bad Request' });
      }
    });

    it('should handle client-side errors', (done) => {
      service.getEmployeeHome().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Trigger client-side error by simulating network failure
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee/home`);
        req.error(new ErrorEvent('Network error', {
          message: 'Network connection failed'
        }));
      }
    });

    it('should handle server error without message', (done) => {
      service.getEmployeeHome().subscribe({
        error: (error) => {
          expect(error.message).toContain('Server returned code 500');
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/employee/home`);
        req.flush({}, { status: 500, statusText: 'Server Error' });
      }
    });
  });

  describe('HTTP Request Configuration', () => {
    it('should use GET method', (done) => {
      service.getEmployeeHome().subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/employee/home`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockEmployeeHomeData });
    });

    it('should call correct endpoint', (done) => {
      service.getEmployeeHome().subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/employee/home`);
      expect(req.request.url).toBe(`${baseUrl}/api/v1/employee/home`);
      req.flush({ data: mockEmployeeHomeData });
    });

    it('should not include request body', (done) => {
      service.getEmployeeHome().subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/employee/home`);
      expect(req.request.body).toBeNull();
      req.flush({ data: mockEmployeeHomeData });
    });
  });
});
