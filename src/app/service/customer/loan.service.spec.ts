/**
 * Unit Tests for LoanService
 *
 * Tests loan operations, fixed deposit retrieval, and validation
 * Target coverage: 90%+
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LoanService } from './loan.service';
import { environment } from 'src/environments/environment';

describe('LoanService', () => {
  let service: LoanService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.baseUrl;

  const mockLoan = {
    loan_id: 'LOAN001',
    customer_id: '123',
    amount: 50000,
    duration_days: 365,
    interest: 8.5,
    loan_type: 'PERSONAL',
    status: 'APPROVED',
    fixed_deposit_id: 1
  };

  const mockFD = {
    fd_id: 1,
    customer_id: '123',
    amount: 100000,
    interest_rate: 7.5,
    duration_days: 730,
    status: 'ACTIVE'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LoanService]
    });

    service = TestBed.inject(LoanService);
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

  describe('getFDs()', () => {
    beforeEach(() => {
      localStorage.setItem('userId', '123');
    });

    it('should fetch fixed deposits successfully', (done) => {
      const mockResponse = {
        data: [mockFD, { ...mockFD, fd_id: 2 }]
      };

      service.getFDs().subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.data.length).toBe(2);
          expect(response.data[0].fd_id).toBe(1);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/fd/user/123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should throw error if userId not in localStorage', (done) => {
      localStorage.removeItem('userId');

      service.getFDs().subscribe({
        error: (error) => {
          expect(error.message).toContain('User ID not found');
          done();
        }
      });
    });

    it('should handle empty fixed deposits list', (done) => {
      const mockResponse = { data: [] };

      service.getFDs().subscribe({
        next: (response) => {
          expect(response.data).toEqual([]);
          expect(response.data.length).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/fd/user/123`);
      req.flush(mockResponse);
    });

    it('should handle 404 error for user with no FDs', (done) => {
      service.getFDs().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/fd/user/123`);
        req.flush({ message: 'No fixed deposits found' }, { status: 404, statusText: 'Not Found' });
      }
    });

    it('should handle network error', (done) => {
      service.getFDs().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/fd/user/123`);
        req.flush(null, { status: 0, statusText: 'Network Error' });
      }
    });

    it('should handle server error', (done) => {
      service.getFDs().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/fd/user/123`);
        req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Server Error' });
      }
    });
  });

  describe('getLoans()', () => {
    beforeEach(() => {
      localStorage.setItem('userId', '123');
    });

    it('should fetch loans successfully', (done) => {
      const mockResponse = {
        data: [mockLoan, { ...mockLoan, loan_id: 'LOAN002' }]
      };

      service.getLoans().subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.data.length).toBe(2);
          expect(response.data[0].loan_id).toBe('LOAN001');
          expect(response.data[0].loan_type).toBe('PERSONAL');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/user/123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should throw error if userId not in localStorage', (done) => {
      localStorage.removeItem('userId');

      service.getLoans().subscribe({
        error: (error) => {
          expect(error.message).toContain('User ID not found');
          done();
        }
      });
    });

    it('should handle empty loans list', (done) => {
      const mockResponse = { data: [] };

      service.getLoans().subscribe({
        next: (response) => {
          expect(response.data).toEqual([]);
          expect(response.data.length).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/user/123`);
      req.flush(mockResponse);
    });

    it('should handle null userId in localStorage', (done) => {
      localStorage.setItem('userId', '');

      service.getLoans().subscribe({
        error: (error) => {
          expect(error.message).toContain('User ID not found');
          done();
        }
      });
    });

    it('should handle 404 error for user with no loans', (done) => {
      service.getLoans().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/user/123`);
        req.flush({ message: 'No loans found' }, { status: 404, statusText: 'Not Found' });
      }
    });

    it('should handle unauthorized error', (done) => {
      service.getLoans().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/user/123`);
        req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
      }
    });

    it('should handle server error', (done) => {
      service.getLoans().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/user/123`);
        req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Server Error' });
      }
    });
  });

  describe('applyLoan()', () => {
    const validLoanData = {
      fdId: 1,
      loanAmount: 50000,
      userId: '123',
      duration: '365',
      interest: '8.5',
      loanType: 'PERSONAL'
    };

    it('should apply for loan successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Loan application submitted successfully',
        loan_id: 'LOAN001'
      };

      service.applyLoan(
        validLoanData.fdId,
        validLoanData.loanAmount,
        validLoanData.userId,
        validLoanData.duration,
        validLoanData.interest,
        validLoanData.loanType
      ).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.success).toBe(true);
          expect(response.loan_id).toBe('LOAN001');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/online`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.fixed_deposit_id).toBe(1);
      expect(req.request.body.amount).toBe(50000);
      expect(req.request.body.customer_id).toBe('123');
      expect(req.request.body.duration_days).toBe('365');
      expect(req.request.body.interest).toBe('8.5');
      expect(req.request.body.loan_type).toBe('PERSONAL');
      req.flush(mockResponse);
    });

    it('should validate fixed deposit ID is required', (done) => {
      service.applyLoan(
        0, // Invalid FD ID
        validLoanData.loanAmount,
        validLoanData.userId,
        validLoanData.duration,
        validLoanData.interest,
        validLoanData.loanType
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Valid fixed deposit ID is required');
          done();
        }
      });
    });

    it('should reject null fixed deposit ID', (done) => {
      service.applyLoan(
        null as any,
        validLoanData.loanAmount,
        validLoanData.userId,
        validLoanData.duration,
        validLoanData.interest,
        validLoanData.loanType
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Valid fixed deposit ID is required');
          done();
        }
      });
    });

    it('should reject negative fixed deposit ID', (done) => {
      service.applyLoan(
        -1,
        validLoanData.loanAmount,
        validLoanData.userId,
        validLoanData.duration,
        validLoanData.interest,
        validLoanData.loanType
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Valid fixed deposit ID is required');
          done();
        }
      });
    });

    it('should validate loan amount is greater than zero', (done) => {
      service.applyLoan(
        validLoanData.fdId,
        0, // Zero amount
        validLoanData.userId,
        validLoanData.duration,
        validLoanData.interest,
        validLoanData.loanType
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Loan amount must be greater than zero');
          done();
        }
      });
    });

    it('should reject negative loan amount', (done) => {
      service.applyLoan(
        validLoanData.fdId,
        -1000,
        validLoanData.userId,
        validLoanData.duration,
        validLoanData.interest,
        validLoanData.loanType
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Loan amount must be greater than zero');
          done();
        }
      });
    });

    it('should reject null loan amount', (done) => {
      service.applyLoan(
        validLoanData.fdId,
        null as any,
        validLoanData.userId,
        validLoanData.duration,
        validLoanData.interest,
        validLoanData.loanType
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Loan amount must be greater than zero');
          done();
        }
      });
    });

    it('should validate user ID is required', (done) => {
      service.applyLoan(
        validLoanData.fdId,
        validLoanData.loanAmount,
        '', // Empty user ID
        validLoanData.duration,
        validLoanData.interest,
        validLoanData.loanType
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('User ID is required');
          done();
        }
      });
    });

    it('should reject null user ID', (done) => {
      service.applyLoan(
        validLoanData.fdId,
        validLoanData.loanAmount,
        null,
        validLoanData.duration,
        validLoanData.interest,
        validLoanData.loanType
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('User ID is required');
          done();
        }
      });
    });

    it('should validate loan duration is required', (done) => {
      service.applyLoan(
        validLoanData.fdId,
        validLoanData.loanAmount,
        validLoanData.userId,
        '', // Empty duration
        validLoanData.interest,
        validLoanData.loanType
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Valid loan duration is required');
          done();
        }
      });
    });

    it('should reject zero duration', (done) => {
      service.applyLoan(
        validLoanData.fdId,
        validLoanData.loanAmount,
        validLoanData.userId,
        '0',
        validLoanData.interest,
        validLoanData.loanType
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Valid loan duration is required');
          done();
        }
      });
    });

    it('should reject negative duration', (done) => {
      service.applyLoan(
        validLoanData.fdId,
        validLoanData.loanAmount,
        validLoanData.userId,
        '-30',
        validLoanData.interest,
        validLoanData.loanType
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Valid loan duration is required');
          done();
        }
      });
    });

    it('should validate interest rate is required', (done) => {
      service.applyLoan(
        validLoanData.fdId,
        validLoanData.loanAmount,
        validLoanData.userId,
        validLoanData.duration,
        '', // Empty interest
        validLoanData.loanType
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Valid interest rate is required');
          done();
        }
      });
    });

    it('should reject negative interest rate', (done) => {
      service.applyLoan(
        validLoanData.fdId,
        validLoanData.loanAmount,
        validLoanData.userId,
        validLoanData.duration,
        '-5',
        validLoanData.loanType
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Valid interest rate is required');
          done();
        }
      });
    });

    it('should accept zero interest rate', (done) => {
      const mockResponse = { success: true };

      service.applyLoan(
        validLoanData.fdId,
        validLoanData.loanAmount,
        validLoanData.userId,
        validLoanData.duration,
        '0',
        validLoanData.loanType
      ).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/online`);
      expect(req.request.body.interest).toBe('0');
      req.flush(mockResponse);
    });

    it('should validate loan type is required', (done) => {
      service.applyLoan(
        validLoanData.fdId,
        validLoanData.loanAmount,
        validLoanData.userId,
        validLoanData.duration,
        validLoanData.interest,
        '' // Empty loan type
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Loan type is required');
          done();
        }
      });
    });

    it('should reject whitespace-only loan type', (done) => {
      service.applyLoan(
        validLoanData.fdId,
        validLoanData.loanAmount,
        validLoanData.userId,
        validLoanData.duration,
        validLoanData.interest,
        '   '
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Loan type is required');
          done();
        }
      });
    });

    it('should accept different loan types', (done) => {
      const mockResponse = { success: true };

      service.applyLoan(
        validLoanData.fdId,
        validLoanData.loanAmount,
        validLoanData.userId,
        validLoanData.duration,
        validLoanData.interest,
        'BUSINESS'
      ).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/online`);
      expect(req.request.body.loan_type).toBe('BUSINESS');
      req.flush(mockResponse);
    });

    it('should handle insufficient collateral error', (done) => {
      service.applyLoan(
        validLoanData.fdId,
        validLoanData.loanAmount,
        validLoanData.userId,
        validLoanData.duration,
        validLoanData.interest,
        validLoanData.loanType
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Insufficient collateral');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/online`);
        req.flush({ message: 'Insufficient collateral' }, { status: 400, statusText: 'Bad Request' });
      }
    });

    it('should handle invalid fixed deposit error', (done) => {
      service.applyLoan(
        validLoanData.fdId,
        validLoanData.loanAmount,
        validLoanData.userId,
        validLoanData.duration,
        validLoanData.interest,
        validLoanData.loanType
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Fixed deposit not found');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/online`);
        req.flush({ message: 'Fixed deposit not found' }, { status: 404, statusText: 'Not Found' });
      }
    });

    it('should handle duplicate loan application error', (done) => {
      service.applyLoan(
        validLoanData.fdId,
        validLoanData.loanAmount,
        validLoanData.userId,
        validLoanData.duration,
        validLoanData.interest,
        validLoanData.loanType
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Loan already exists');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/online`);
        req.flush({ message: 'Loan already exists for this FD' }, { status: 409, statusText: 'Conflict' });
      }
    });

    it('should handle server error', (done) => {
      service.applyLoan(
        validLoanData.fdId,
        validLoanData.loanAmount,
        validLoanData.userId,
        validLoanData.duration,
        validLoanData.interest,
        validLoanData.loanType
      ).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/online`);
        req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Server Error' });
      }
    });

    it('should handle network error', (done) => {
      service.applyLoan(
        validLoanData.fdId,
        validLoanData.loanAmount,
        validLoanData.userId,
        validLoanData.duration,
        validLoanData.interest,
        validLoanData.loanType
      ).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/online`);
        req.flush(null, { status: 0, statusText: 'Network Error' });
      }
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      localStorage.setItem('userId', '123');
    });

    it('should log errors to console', (done) => {
      spyOn(console, 'error');

      service.getLoans().subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalled();
          done();
        }
      });

      // Trigger error
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/user/123`);
        req.flush({ message: 'Error' }, { status: 500, statusText: 'Error' });
      }
    });

    it('should format error messages correctly', (done) => {
      service.getFDs().subscribe({
        error: (error) => {
          expect(error.message).toContain('Test error message');
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/fd/user/123`);
        req.flush({ message: 'Test error message' }, { status: 400, statusText: 'Bad Request' });
      }
    });

    it('should handle client-side errors', (done) => {
      service.getLoans().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Trigger client-side error by simulating network failure
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/loan/user/123`);
        req.error(new ErrorEvent('Network error', {
          message: 'Network connection failed'
        }));
      }
    });
  });
});
