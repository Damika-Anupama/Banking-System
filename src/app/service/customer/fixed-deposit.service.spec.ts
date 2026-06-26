/**
 * Unit Tests for FixedDepositService
 *
 * Tests fixed deposit creation, savings account retrieval, and validation
 * Target coverage: 90%+
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FixedDepositService } from './fixed-deposit.service';
import { environment } from 'src/environments/environment';

describe('FixedDepositService', () => {
  let service: FixedDepositService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.baseUrl;

  const mockSavingsAccount = {
    account_id: 'SAV001',
    user_id: '123',
    balance: 100000,
    account_type: 'SAVINGS',
    status: 'ACTIVE'
  };

  const mockFD = {
    fd_id: 1,
    saving_account_id: 'SAV001',
    amount: 50000,
    duration: 365,
    rate_per_annum: 7.5,
    status: 'ACTIVE',
    maturity_date: '2025-11-26'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FixedDepositService]
    });

    service = TestBed.inject(FixedDepositService);
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

  describe('getSavingAccountsDetails()', () => {
    beforeEach(() => {
      localStorage.setItem('userId', '123');
    });

    it('should fetch savings account details successfully', (done) => {
      const mockResponse = {
        data: [mockSavingsAccount, { ...mockSavingsAccount, account_id: 'SAV002' }]
      };

      service.getSavingAccountsDetails().subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.data.length).toBe(2);
          expect(response.data[0].account_id).toBe('SAV001');
          expect(response.data[0].account_type).toBe('SAVINGS');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/fd/savingAccountsDetails/123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should throw error if userId not in localStorage', (done) => {
      localStorage.removeItem('userId');

      service.getSavingAccountsDetails().subscribe({
        error: (error) => {
          expect(error.message).toContain('User ID not found');
          done();
        }
      });
    });

    it('should handle null userId in localStorage', (done) => {
      localStorage.setItem('userId', '');

      service.getSavingAccountsDetails().subscribe({
        error: (error) => {
          expect(error.message).toContain('User ID not found');
          done();
        }
      });
    });

    it('should handle empty savings accounts list', (done) => {
      const mockResponse = { data: [] };

      service.getSavingAccountsDetails().subscribe({
        next: (response) => {
          expect(response.data).toEqual([]);
          expect(response.data.length).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/fd/savingAccountsDetails/123`);
      req.flush(mockResponse);
    });

    it('should handle 404 error for user with no savings accounts', (done) => {
      service.getSavingAccountsDetails().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/fd/savingAccountsDetails/123`);
        req.flush({ message: 'No savings accounts found' }, { status: 404, statusText: 'Not Found' });
      }
    });

    it('should handle unauthorized error', (done) => {
      service.getSavingAccountsDetails().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/fd/savingAccountsDetails/123`);
        req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
      }
    });

    it('should handle network error', (done) => {
      service.getSavingAccountsDetails().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/fd/savingAccountsDetails/123`);
        req.flush(null, { status: 0, statusText: 'Network Error' });
      }
    });

    it('should handle server error', (done) => {
      service.getSavingAccountsDetails().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/fd/savingAccountsDetails/123`);
        req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Server Error' });
      }
    });
  });

  describe('createFD()', () => {
    const validFDData = {
      savingsAccountId: 'SAV001',
      duration: '365',
      interest: '7.5',
      amount: '50000'
    };

    it('should create fixed deposit successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Fixed deposit created successfully',
        fd_id: 1
      };

      service.createFD(
        validFDData.savingsAccountId,
        validFDData.duration,
        validFDData.interest,
        validFDData.amount
      ).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.success).toBe(true);
          expect(response.fd_id).toBe(1);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/fd`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.saving_account_id).toBe('SAV001');
      expect(req.request.body.duration).toBe('365');
      expect(req.request.body.rate_per_annum).toBe('7.5');
      expect(req.request.body.amount).toBe('50000');
      req.flush(mockResponse);
    });

    it('should validate savings account ID is required', (done) => {
      service.createFD(
        '', // Empty savings account ID
        validFDData.duration,
        validFDData.interest,
        validFDData.amount
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Savings account ID is required');
          done();
        }
      });
    });

    it('should reject null savings account ID', (done) => {
      service.createFD(
        null,
        validFDData.duration,
        validFDData.interest,
        validFDData.amount
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Savings account ID is required');
          done();
        }
      });
    });

    it('should reject undefined savings account ID', (done) => {
      service.createFD(
        undefined,
        validFDData.duration,
        validFDData.interest,
        validFDData.amount
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Savings account ID is required');
          done();
        }
      });
    });

    it('should validate duration is required', (done) => {
      service.createFD(
        validFDData.savingsAccountId,
        '', // Empty duration
        validFDData.interest,
        validFDData.amount
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Valid duration is required');
          done();
        }
      });
    });

    it('should reject zero duration', (done) => {
      service.createFD(
        validFDData.savingsAccountId,
        '0',
        validFDData.interest,
        validFDData.amount
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Valid duration is required');
          done();
        }
      });
    });

    it('should reject negative duration', (done) => {
      service.createFD(
        validFDData.savingsAccountId,
        '-30',
        validFDData.interest,
        validFDData.amount
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Valid duration is required');
          done();
        }
      });
    });

    it('should reject null duration', (done) => {
      service.createFD(
        validFDData.savingsAccountId,
        null,
        validFDData.interest,
        validFDData.amount
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Valid duration is required');
          done();
        }
      });
    });

    it('should validate interest rate is required', (done) => {
      service.createFD(
        validFDData.savingsAccountId,
        validFDData.duration,
        '', // Empty interest
        validFDData.amount
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Valid interest rate is required');
          done();
        }
      });
    });

    it('should reject negative interest rate', (done) => {
      service.createFD(
        validFDData.savingsAccountId,
        validFDData.duration,
        '-5',
        validFDData.amount
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Valid interest rate is required');
          done();
        }
      });
    });

    it('should accept zero interest rate', (done) => {
      const mockResponse = { success: true };

      service.createFD(
        validFDData.savingsAccountId,
        validFDData.duration,
        '0',
        validFDData.amount
      ).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/fd`);
      expect(req.request.body.rate_per_annum).toBe('0');
      req.flush(mockResponse);
    });

    it('should reject null interest rate', (done) => {
      service.createFD(
        validFDData.savingsAccountId,
        validFDData.duration,
        null,
        validFDData.amount
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Valid interest rate is required');
          done();
        }
      });
    });

    it('should validate amount is greater than zero', (done) => {
      service.createFD(
        validFDData.savingsAccountId,
        validFDData.duration,
        validFDData.interest,
        '0' // Zero amount
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Amount must be greater than zero');
          done();
        }
      });
    });

    it('should reject negative amount', (done) => {
      service.createFD(
        validFDData.savingsAccountId,
        validFDData.duration,
        validFDData.interest,
        '-1000'
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Amount must be greater than zero');
          done();
        }
      });
    });

    it('should reject null amount', (done) => {
      service.createFD(
        validFDData.savingsAccountId,
        validFDData.duration,
        validFDData.interest,
        null
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Amount must be greater than zero');
          done();
        }
      });
    });

    it('should reject empty string amount', (done) => {
      service.createFD(
        validFDData.savingsAccountId,
        validFDData.duration,
        validFDData.interest,
        ''
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Amount must be greater than zero');
          done();
        }
      });
    });

    it('should accept numeric savings account ID', (done) => {
      const mockResponse = { success: true };

      service.createFD(
        123456, // Numeric ID
        validFDData.duration,
        validFDData.interest,
        validFDData.amount
      ).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/fd`);
      expect(req.request.body.saving_account_id).toBe(123456);
      req.flush(mockResponse);
    });

    it('should accept numeric duration', (done) => {
      const mockResponse = { success: true };

      service.createFD(
        validFDData.savingsAccountId,
        365, // Numeric duration
        validFDData.interest,
        validFDData.amount
      ).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/fd`);
      expect(req.request.body.duration).toBe(365);
      req.flush(mockResponse);
    });

    it('should accept numeric interest rate', (done) => {
      const mockResponse = { success: true };

      service.createFD(
        validFDData.savingsAccountId,
        validFDData.duration,
        7.5, // Numeric interest
        validFDData.amount
      ).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/fd`);
      expect(req.request.body.rate_per_annum).toBe(7.5);
      req.flush(mockResponse);
    });

    it('should accept numeric amount', (done) => {
      const mockResponse = { success: true };

      service.createFD(
        validFDData.savingsAccountId,
        validFDData.duration,
        validFDData.interest,
        50000 // Numeric amount
      ).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/fd`);
      expect(req.request.body.amount).toBe(50000);
      req.flush(mockResponse);
    });

    it('should handle insufficient balance error', (done) => {
      service.createFD(
        validFDData.savingsAccountId,
        validFDData.duration,
        validFDData.interest,
        validFDData.amount
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Insufficient balance');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/fd`);
        req.flush({ message: 'Insufficient balance in savings account' }, { status: 400, statusText: 'Bad Request' });
      }
    });

    it('should handle invalid savings account error', (done) => {
      service.createFD(
        validFDData.savingsAccountId,
        validFDData.duration,
        validFDData.interest,
        validFDData.amount
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Savings account not found');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/fd`);
        req.flush({ message: 'Savings account not found' }, { status: 404, statusText: 'Not Found' });
      }
    });

    it('should handle minimum amount error', (done) => {
      service.createFD(
        validFDData.savingsAccountId,
        validFDData.duration,
        validFDData.interest,
        validFDData.amount
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Minimum amount');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/fd`);
        req.flush({ message: 'Minimum amount required is Rs. 10,000' }, { status: 400, statusText: 'Bad Request' });
      }
    });

    it('should handle duplicate FD error', (done) => {
      service.createFD(
        validFDData.savingsAccountId,
        validFDData.duration,
        validFDData.interest,
        validFDData.amount
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('already exists');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/fd`);
        req.flush({ message: 'Fixed deposit already exists' }, { status: 409, statusText: 'Conflict' });
      }
    });

    it('should handle server error', (done) => {
      service.createFD(
        validFDData.savingsAccountId,
        validFDData.duration,
        validFDData.interest,
        validFDData.amount
      ).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/fd`);
        req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Server Error' });
      }
    });

    it('should handle network error', (done) => {
      service.createFD(
        validFDData.savingsAccountId,
        validFDData.duration,
        validFDData.interest,
        validFDData.amount
      ).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/fd`);
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

      service.getSavingAccountsDetails().subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalled();
          done();
        }
      });

      // Trigger error
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/fd/savingAccountsDetails/123`);
        req.flush({ message: 'Error' }, { status: 500, statusText: 'Error' });
      }
    });

    it('should format error messages correctly', (done) => {
      service.getSavingAccountsDetails().subscribe({
        error: (error) => {
          expect(error.message).toContain('Test error message');
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/fd/savingAccountsDetails/123`);
        req.flush({ message: 'Test error message' }, { status: 400, statusText: 'Bad Request' });
      }
    });

    it('should handle client-side errors', (done) => {
      service.getSavingAccountsDetails().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Trigger client-side error by simulating network failure
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/fd/savingAccountsDetails/123`);
        req.error(new ErrorEvent('Network error', {
          message: 'Network connection failed'
        }));
      }
    });

    it('should handle timeout errors', (done) => {
      service.createFD(
        'SAV001',
        '365',
        '7.5',
        '50000'
      ).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Trigger timeout by not responding
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/fd`);
        req.flush({ message: 'Request timeout' }, { status: 408, statusText: 'Request Timeout' });
      }
    });
  });
});
