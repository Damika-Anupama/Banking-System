/**
 * Unit Tests for LoanApprovalService
 *
 * Tests loan approval operations and error handling
 * Target coverage: 90%+
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LoanApprovalService } from './loan.approval.service';
import { environment } from 'src/environments/environment';

describe('LoanApprovalService', () => {
  let service: LoanApprovalService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.baseUrl;

  const mockUnapprovedLoans = [
    {
      loan_id: 'LOAN001',
      customer_id: 'CUST001',
      customer_name: 'John Doe',
      amount: 50000,
      loan_type: 'PERSONAL',
      duration_days: 365,
      interest: 8.5,
      fixed_deposit_id: 1,
      status: 'PENDING',
      applied_date: '2025-11-20',
      branch_name: 'Main Branch'
    },
    {
      loan_id: 'LOAN002',
      customer_id: 'CUST002',
      customer_name: 'Jane Smith',
      amount: 100000,
      loan_type: 'BUSINESS',
      duration_days: 730,
      interest: 9.5,
      fixed_deposit_id: 2,
      status: 'PENDING',
      applied_date: '2025-11-21',
      branch_name: 'Downtown Branch'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LoanApprovalService]
    });

    service = TestBed.inject(LoanApprovalService);
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

  describe('getUnapprovedLoans()', () => {
    it('should fetch unapproved loans successfully', (done) => {
      const mockResponse = { data: mockUnapprovedLoans };

      service.getUnapprovedLoans().subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.data.length).toBe(2);
          expect(response.data[0].loan_id).toBe('LOAN001');
          expect(response.data[0].status).toBe('PENDING');
          expect(response.data[1].loan_id).toBe('LOAN002');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty unapproved loans list', (done) => {
      const emptyResponse = { data: [] };

      service.getUnapprovedLoans().subscribe({
        next: (response) => {
          expect(response.data).toEqual([]);
          expect(response.data.length).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
      req.flush(emptyResponse);
    });

    it('should handle single unapproved loan', (done) => {
      const singleLoanResponse = { data: [mockUnapprovedLoans[0]] };

      service.getUnapprovedLoans().subscribe({
        next: (response) => {
          expect(response.data.length).toBe(1);
          expect(response.data[0].loan_id).toBe('LOAN001');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
      req.flush(singleLoanResponse);
    });

    it('should handle multiple unapproved loans', (done) => {
      const manyLoans = [
        ...mockUnapprovedLoans,
        { ...mockUnapprovedLoans[0], loan_id: 'LOAN003' },
        { ...mockUnapprovedLoans[0], loan_id: 'LOAN004' },
        { ...mockUnapprovedLoans[0], loan_id: 'LOAN005' }
      ];
      const manyLoansResponse = { data: manyLoans };

      service.getUnapprovedLoans().subscribe({
        next: (response) => {
          expect(response.data.length).toBe(5);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
      req.flush(manyLoansResponse);
    });

    it('should verify loan data structure', (done) => {
      const mockResponse = { data: mockUnapprovedLoans };

      service.getUnapprovedLoans().subscribe({
        next: (response) => {
          const loan = response.data[0];
          expect(loan.loan_id).toBeDefined();
          expect(loan.customer_name).toBeDefined();
          expect(loan.amount).toBeDefined();
          expect(loan.loan_type).toBeDefined();
          expect(loan.status).toBe('PENDING');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
      req.flush(mockResponse);
    });

    it('should handle unauthorized error (401)', (done) => {
      service.getUnapprovedLoans().subscribe({
        error: (error) => {
          expect(error.message).toContain('Unauthorized');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
        req.flush({ message: 'Unauthorized access' }, { status: 401, statusText: 'Unauthorized' });
      }
    });

    it('should handle forbidden error (403)', (done) => {
      service.getUnapprovedLoans().subscribe({
        error: (error) => {
          expect(error.message).toContain('Forbidden');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
        req.flush({ message: 'Forbidden - insufficient permissions' }, { status: 403, statusText: 'Forbidden' });
      }
    });

    it('should handle not found error (404)', (done) => {
      service.getUnapprovedLoans().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
        req.flush({ message: 'No unapproved loans found' }, { status: 404, statusText: 'Not Found' });
      }
    });

    it('should handle server error (500)', (done) => {
      service.getUnapprovedLoans().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
        req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Server Error' });
      }
    });

    it('should handle network error', (done) => {
      service.getUnapprovedLoans().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
        req.flush(null, { status: 0, statusText: 'Network Error' });
      }
    });

    it('should handle timeout error', (done) => {
      service.getUnapprovedLoans().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
        req.flush({ message: 'Request timeout' }, { status: 408, statusText: 'Request Timeout' });
      }
    });

    it('should handle service unavailable error (503)', (done) => {
      service.getUnapprovedLoans().subscribe({
        error: (error) => {
          expect(error.message).toContain('Service Unavailable');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
        req.flush({ message: 'Service Unavailable' }, { status: 503, statusText: 'Service Unavailable' });
      }
    });

    it('should handle bad gateway error (502)', (done) => {
      service.getUnapprovedLoans().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
        req.flush({ message: 'Bad Gateway' }, { status: 502, statusText: 'Bad Gateway' });
      }
    });
  });

  describe('Error Handling', () => {
    it('should log errors to console', (done) => {
      spyOn(console, 'error');

      service.getUnapprovedLoans().subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalled();
          done();
        }
      });

      // Trigger error
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
        req.flush({ message: 'Error' }, { status: 500, statusText: 'Error' });
      }
    });

    it('should format error messages correctly', (done) => {
      service.getUnapprovedLoans().subscribe({
        error: (error) => {
          expect(error.message).toContain('Test error message');
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
        req.flush({ message: 'Test error message' }, { status: 400, statusText: 'Bad Request' });
      }
    });

    it('should handle client-side errors', (done) => {
      service.getUnapprovedLoans().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Trigger client-side error by simulating network failure
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
        req.error(new ErrorEvent('Network error', {
          message: 'Network connection failed'
        }));
      }
    });

    it('should handle server error without message', (done) => {
      service.getUnapprovedLoans().subscribe({
        error: (error) => {
          expect(error.message).toContain('Server returned code 500');
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
        req.flush({}, { status: 500, statusText: 'Server Error' });
      }
    });
  });

  describe('HTTP Request Configuration', () => {
    it('should use GET method', (done) => {
      service.getUnapprovedLoans().subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [] });
    });

    it('should call correct endpoint', (done) => {
      service.getUnapprovedLoans().subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
      expect(req.request.url).toBe(`${baseUrl}/api/v1/loan/unapproved-loans`);
      req.flush({ data: [] });
    });

    it('should not include request body', (done) => {
      service.getUnapprovedLoans().subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
      expect(req.request.body).toBeNull();
      req.flush({ data: [] });
    });
  });

  describe('Response Data Variations', () => {
    it('should handle loans with different loan types', (done) => {
      const variedLoans = [
        { ...mockUnapprovedLoans[0], loan_type: 'PERSONAL' },
        { ...mockUnapprovedLoans[0], loan_id: 'LOAN002', loan_type: 'BUSINESS' },
        { ...mockUnapprovedLoans[0], loan_id: 'LOAN003', loan_type: 'HOUSING' },
        { ...mockUnapprovedLoans[0], loan_id: 'LOAN004', loan_type: 'EDUCATION' }
      ];

      service.getUnapprovedLoans().subscribe({
        next: (response) => {
          expect(response.data.length).toBe(4);
          expect(response.data[0].loan_type).toBe('PERSONAL');
          expect(response.data[1].loan_type).toBe('BUSINESS');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
      req.flush({ data: variedLoans });
    });

    it('should handle loans with varying amounts', (done) => {
      const variedAmounts = [
        { ...mockUnapprovedLoans[0], amount: 10000 },
        { ...mockUnapprovedLoans[0], loan_id: 'LOAN002', amount: 500000 },
        { ...mockUnapprovedLoans[0], loan_id: 'LOAN003', amount: 1000000 }
      ];

      service.getUnapprovedLoans().subscribe({
        next: (response) => {
          expect(response.data[0].amount).toBe(10000);
          expect(response.data[1].amount).toBe(500000);
          expect(response.data[2].amount).toBe(1000000);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
      req.flush({ data: variedAmounts });
    });

    it('should handle loans from different branches', (done) => {
      const differentBranches = [
        { ...mockUnapprovedLoans[0], branch_name: 'Main Branch' },
        { ...mockUnapprovedLoans[0], loan_id: 'LOAN002', branch_name: 'Downtown Branch' },
        { ...mockUnapprovedLoans[0], loan_id: 'LOAN003', branch_name: 'Uptown Branch' }
      ];

      service.getUnapprovedLoans().subscribe({
        next: (response) => {
          expect(response.data[0].branch_name).toBe('Main Branch');
          expect(response.data[1].branch_name).toBe('Downtown Branch');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/unapproved-loans`);
      req.flush({ data: differentBranches });
    });
  });
});
