/**
 * Unit Tests for ManagerHomeService
 *
 * Tests manager dashboard operations and branch statistics
 * Target coverage: 90%+
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ManagerHomeService } from './manager.home.service';
import { environment } from 'src/environments/environment';

describe('ManagerHomeService', () => {
  let service: ManagerHomeService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.baseUrl;

  const mockDashboardBlocks = {
    total_customers: 500,
    total_employees: 25,
    total_transactions: 1500,
    pending_approvals: 10,
    branch_name: 'Main Branch',
    branch_id: 'BR001'
  };

  const mockTransactions = {
    total_amount: 1500000,
    transaction_count: 350,
    today_transactions: 45
  };

  const mockWithdrawals = {
    total_amount: 250000,
    withdrawal_count: 80,
    today_withdrawals: 12
  };

  const mockLateLoans = {
    late_loans: [
      {
        loan_id: 'LOAN001',
        customer_name: 'John Doe',
        amount: 50000,
        days_late: 15,
        status: 'OVERDUE'
      }
    ],
    total_late_loans: 5,
    total_late_amount: 250000
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ManagerHomeService]
    });

    service = TestBed.inject(ManagerHomeService);
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

  describe('getDashboardBlockDetails()', () => {
    beforeEach(() => {
      localStorage.setItem('email', 'manager@example.com');
    });

    it('should fetch dashboard block details successfully', (done) => {
      const mockResponse = { data: mockDashboardBlocks };

      service.getDashboardBlockDetails().subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.data.total_customers).toBe(500);
          expect(response.data.branch_name).toBe('Main Branch');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/dashboard-blocks/manager@example.com`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should throw error if email not in localStorage', (done) => {
      localStorage.removeItem('email');

      service.getDashboardBlockDetails().subscribe({
        error: (error) => {
          expect(error.message).toContain('Manager email not found');
          done();
        }
      });
    });

    it('should handle empty email in localStorage', (done) => {
      localStorage.setItem('email', '');

      service.getDashboardBlockDetails().subscribe({
        error: (error) => {
          expect(error.message).toContain('Manager email not found');
          done();
        }
      });
    });

    it('should handle 404 error', (done) => {
      service.getDashboardBlockDetails().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/dashboard-blocks/manager@example.com`);
        req.flush({ message: 'Manager not found' }, { status: 404, statusText: 'Not Found' });
      }
    });

    it('should handle unauthorized error', (done) => {
      service.getDashboardBlockDetails().subscribe({
        error: (error) => {
          expect(error.message).toContain('Unauthorized');
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/dashboard-blocks/manager@example.com`);
        req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
      }
    });

    it('should handle server error', (done) => {
      service.getDashboardBlockDetails().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/dashboard-blocks/manager@example.com`);
        req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Server Error' });
      }
    });
  });

  describe('getTotalTransactions()', () => {
    it('should fetch total transactions successfully', (done) => {
      const branchId = 'BR001';
      const mockResponse = { data: mockTransactions };

      service.getTotalTransactions(branchId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.data.total_amount).toBe(1500000);
          expect(response.data.transaction_count).toBe(350);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/total-transactions/${branchId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should validate branch ID is required', (done) => {
      service.getTotalTransactions('').subscribe({
        error: (error) => {
          expect(error.message).toContain('Branch ID is required');
          done();
        }
      });
    });

    it('should reject null branch ID', (done) => {
      service.getTotalTransactions(null).subscribe({
        error: (error) => {
          expect(error.message).toContain('Branch ID is required');
          done();
        }
      });
    });

    it('should reject undefined branch ID', (done) => {
      service.getTotalTransactions(undefined).subscribe({
        error: (error) => {
          expect(error.message).toContain('Branch ID is required');
          done();
        }
      });
    });

    it('should accept numeric branch ID', (done) => {
      const mockResponse = { data: mockTransactions };

      service.getTotalTransactions(123).subscribe({
        next: (response) => {
          expect(response.data.transaction_count).toBe(350);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/total-transactions/123`);
      req.flush(mockResponse);
    });

    it('should handle 404 error for invalid branch', (done) => {
      service.getTotalTransactions('INVALID').subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/total-transactions/INVALID`);
        req.flush({ message: 'Branch not found' }, { status: 404, statusText: 'Not Found' });
      }
    });

    it('should handle network error', (done) => {
      service.getTotalTransactions('BR001').subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/total-transactions/BR001`);
        req.flush(null, { status: 0, statusText: 'Network Error' });
      }
    });
  });

  describe('getTotalWithdrawals()', () => {
    it('should fetch total withdrawals successfully', (done) => {
      const branchId = 'BR001';
      const mockResponse = { data: mockWithdrawals };

      service.getTotalWithdrawals(branchId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.data.total_amount).toBe(250000);
          expect(response.data.withdrawal_count).toBe(80);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/total-withdrawals/${branchId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should validate branch ID is required', (done) => {
      service.getTotalWithdrawals('').subscribe({
        error: (error) => {
          expect(error.message).toContain('Branch ID is required');
          done();
        }
      });
    });

    it('should reject null branch ID', (done) => {
      service.getTotalWithdrawals(null).subscribe({
        error: (error) => {
          expect(error.message).toContain('Branch ID is required');
          done();
        }
      });
    });

    it('should reject undefined branch ID', (done) => {
      service.getTotalWithdrawals(undefined).subscribe({
        error: (error) => {
          expect(error.message).toContain('Branch ID is required');
          done();
        }
      });
    });

    it('should accept numeric branch ID', (done) => {
      const mockResponse = { data: mockWithdrawals };

      service.getTotalWithdrawals(456).subscribe({
        next: (response) => {
          expect(response.data.withdrawal_count).toBe(80);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/total-withdrawals/456`);
      req.flush(mockResponse);
    });

    it('should handle empty withdrawals', (done) => {
      const emptyResponse = {
        data: {
          total_amount: 0,
          withdrawal_count: 0,
          today_withdrawals: 0
        }
      };

      service.getTotalWithdrawals('BR001').subscribe({
        next: (response) => {
          expect(response.data.withdrawal_count).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/total-withdrawals/BR001`);
      req.flush(emptyResponse);
    });

    it('should handle server error', (done) => {
      service.getTotalWithdrawals('BR001').subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/total-withdrawals/BR001`);
        req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Server Error' });
      }
    });
  });

  describe('getLateLoans()', () => {
    it('should fetch late loans successfully', (done) => {
      const branchId = 'BR001';
      const mockResponse = { data: mockLateLoans };

      service.getLateLoans(branchId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.data.total_late_loans).toBe(5);
          expect(response.data.late_loans.length).toBe(1);
          expect(response.data.late_loans[0].loan_id).toBe('LOAN001');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/late-loans/${branchId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should validate branch ID is required', (done) => {
      service.getLateLoans('').subscribe({
        error: (error) => {
          expect(error.message).toContain('Branch ID is required');
          done();
        }
      });
    });

    it('should reject null branch ID', (done) => {
      service.getLateLoans(null).subscribe({
        error: (error) => {
          expect(error.message).toContain('Branch ID is required');
          done();
        }
      });
    });

    it('should reject undefined branch ID', (done) => {
      service.getLateLoans(undefined).subscribe({
        error: (error) => {
          expect(error.message).toContain('Branch ID is required');
          done();
        }
      });
    });

    it('should accept numeric branch ID', (done) => {
      const mockResponse = { data: mockLateLoans };

      service.getLateLoans(789).subscribe({
        next: (response) => {
          expect(response.data.total_late_loans).toBe(5);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/late-loans/789`);
      req.flush(mockResponse);
    });

    it('should handle no late loans', (done) => {
      const emptyResponse = {
        data: {
          late_loans: [],
          total_late_loans: 0,
          total_late_amount: 0
        }
      };

      service.getLateLoans('BR001').subscribe({
        next: (response) => {
          expect(response.data.late_loans.length).toBe(0);
          expect(response.data.total_late_loans).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/late-loans/BR001`);
      req.flush(emptyResponse);
    });

    it('should handle 404 error for invalid branch', (done) => {
      service.getLateLoans('INVALID').subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/late-loans/INVALID`);
        req.flush({ message: 'Branch not found' }, { status: 404, statusText: 'Not Found' });
      }
    });

    it('should handle server error', (done) => {
      service.getLateLoans('BR001').subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/late-loans/BR001`);
        req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Server Error' });
      }
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      localStorage.setItem('email', 'manager@example.com');
    });

    it('should log errors to console', (done) => {
      spyOn(console, 'error');

      service.getDashboardBlockDetails().subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalled();
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/dashboard-blocks/manager@example.com`);
        req.flush({ message: 'Error' }, { status: 500, statusText: 'Error' });
      }
    });

    it('should format error messages correctly', (done) => {
      service.getTotalTransactions('BR001').subscribe({
        error: (error) => {
          expect(error.message).toContain('Test error message');
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/total-transactions/BR001`);
        req.flush({ message: 'Test error message' }, { status: 400, statusText: 'Bad Request' });
      }
    });

    it('should handle client-side errors', (done) => {
      service.getTotalWithdrawals('BR001').subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/total-withdrawals/BR001`);
        req.error(new ErrorEvent('Network error', {
          message: 'Network connection failed'
        }));
      }
    });

    it('should handle server error without message', (done) => {
      service.getLateLoans('BR001').subscribe({
        error: (error) => {
          expect(error.message).toContain('Server returned code 500');
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/manager/late-loans/BR001`);
        req.flush({}, { status: 500, statusText: 'Server Error' });
      }
    });
  });
});
