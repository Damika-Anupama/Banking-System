/**
 * Unit Tests for TransactionService
 *
 * Tests transaction operations, validations, and error handling
 * Target coverage: 90%+
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TransactionService } from './transaction.service';
import { environment } from 'src/environments/environment';
import { mockTransaction } from 'src/testing/test-helpers';

describe('TransactionService', () => {
  let service: TransactionService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.baseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TransactionService]
    });

    service = TestBed.inject(TransactionService);
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

  describe('getAccountDetails()', () => {
    beforeEach(() => {
      localStorage.setItem('userId', '123');
    });

    it('should fetch account details successfully', (done) => {
      const mockResponse = {
        data: {
          account_id: 'ACC001',
          balance: 10000,
          account_type: 'SAVINGS'
        }
      };

      service.getAccountDetails().subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.data.account_id).toBe('ACC001');
          expect(response.data.balance).toBe(10000);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/pageDetails/123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should throw error if userId not in localStorage', (done) => {
      localStorage.removeItem('userId');

      service.getAccountDetails().subscribe({
        error: (error) => {
          expect(error.message).toContain('User ID not found');
          done();
        }
      });
    });

    it('should handle 404 error', (done) => {
      service.getAccountDetails().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/pageDetails/123`);
        req.flush({ message: 'Account not found' }, { status: 404, statusText: 'Not Found' });
      }
    });

    it('should handle network error', (done) => {
      service.getAccountDetails().subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/pageDetails/123`);
        req.flush(null, { status: 0, statusText: 'Network Error' });
      }
    });
  });

  describe('proceedTransaction()', () => {
    const validTransactionData = {
      fromAccount: 'ACC001',
      toAccount: 'ACC002',
      amount: '1000',
      senderRemarks: 'Payment for services',
      beneficiaryRemarks: 'Received payment'
    };

    it('should create transaction successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Transaction completed successfully',
        transaction_id: 'TXN123'
      };

      service.proceedTransaction(
        validTransactionData.fromAccount,
        validTransactionData.toAccount,
        validTransactionData.amount,
        validTransactionData.senderRemarks,
        validTransactionData.beneficiaryRemarks
      ).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.success).toBe(true);
          expect(response.transaction_id).toBe('TXN123');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/transfer`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.from_account).toBe('ACC001');
      expect(req.request.body.to_account).toBe('ACC002');
      expect(req.request.body.amount).toBe('1000');
      expect(req.request.body.transaction_fee).toBe(0);
      req.flush(mockResponse);
    });

    it('should validate source account is required', (done) => {
      service.proceedTransaction(
        '', // Empty source account
        validTransactionData.toAccount,
        validTransactionData.amount,
        validTransactionData.senderRemarks,
        validTransactionData.beneficiaryRemarks
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Source account is required');
          done();
        }
      });
    });

    it('should validate destination account is required', (done) => {
      service.proceedTransaction(
        validTransactionData.fromAccount,
        '', // Empty destination account
        validTransactionData.amount,
        validTransactionData.senderRemarks,
        validTransactionData.beneficiaryRemarks
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Destination account is required');
          done();
        }
      });
    });

    it('should reject same source and destination accounts', (done) => {
      service.proceedTransaction(
        'ACC001',
        'ACC001', // Same as source
        validTransactionData.amount,
        validTransactionData.senderRemarks,
        validTransactionData.beneficiaryRemarks
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('cannot be the same');
          done();
        }
      });
    });

    it('should validate amount is greater than zero', (done) => {
      service.proceedTransaction(
        validTransactionData.fromAccount,
        validTransactionData.toAccount,
        '0', // Zero amount
        validTransactionData.senderRemarks,
        validTransactionData.beneficiaryRemarks
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('greater than zero');
          done();
        }
      });
    });

    it('should reject negative amounts', (done) => {
      service.proceedTransaction(
        validTransactionData.fromAccount,
        validTransactionData.toAccount,
        '-100', // Negative amount
        validTransactionData.senderRemarks,
        validTransactionData.beneficiaryRemarks
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('greater than zero');
          done();
        }
      });
    });

    it('should handle empty remarks gracefully', (done) => {
      const mockResponse = { success: true };

      service.proceedTransaction(
        validTransactionData.fromAccount,
        validTransactionData.toAccount,
        validTransactionData.amount,
        '', // Empty sender remarks
        ''  // Empty beneficiary remarks
      ).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/transfer`);
      expect(req.request.body.sender_remarks).toBe('');
      expect(req.request.body.beneficiary_remarks).toBe('');
      req.flush(mockResponse);
    });

    it('should trim whitespace from account numbers', (done) => {
      const mockResponse = { success: true };

      service.proceedTransaction(
        '  ACC001  ', // With whitespace
        '  ACC002  ', // With whitespace
        validTransactionData.amount,
        validTransactionData.senderRemarks,
        validTransactionData.beneficiaryRemarks
      ).subscribe({
        next: () => {
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/transfer`);
      expect(req.request.body.from_account).toBe('ACC001');
      expect(req.request.body.to_account).toBe('ACC002');
      req.flush(mockResponse);
    });

    it('should accept numeric account numbers', (done) => {
      const mockResponse = { success: true };

      service.proceedTransaction(
        123456, // Number instead of string
        789012, // Number instead of string
        validTransactionData.amount,
        validTransactionData.senderRemarks,
        validTransactionData.beneficiaryRemarks
      ).subscribe({
        next: () => {
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/transfer`);
      expect(req.request.body.from_account).toBe('123456');
      expect(req.request.body.to_account).toBe('789012');
      req.flush(mockResponse);
    });

    it('should handle insufficient funds error', (done) => {
      service.proceedTransaction(
        validTransactionData.fromAccount,
        validTransactionData.toAccount,
        validTransactionData.amount,
        validTransactionData.senderRemarks,
        validTransactionData.beneficiaryRemarks
      ).subscribe({
        error: (error) => {
          expect(error.message).toContain('Insufficient funds');
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/transfer`);
        req.flush({ message: 'Insufficient funds' }, { status: 400, statusText: 'Bad Request' });
      }
    });

    it('should handle invalid beneficiary account error', (done) => {
      service.proceedTransaction(
        validTransactionData.fromAccount,
        validTransactionData.toAccount,
        validTransactionData.amount,
        validTransactionData.senderRemarks,
        validTransactionData.beneficiaryRemarks
      ).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/transfer`);
        req.flush({ message: 'Beneficiary account not found' }, { status: 404, statusText: 'Not Found' });
      }
    });

    it('should handle server error', (done) => {
      service.proceedTransaction(
        validTransactionData.fromAccount,
        validTransactionData.toAccount,
        validTransactionData.amount,
        validTransactionData.senderRemarks,
        validTransactionData.beneficiaryRemarks
      ).subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/transfer`);
        req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Server Error' });
      }
    });
  });

  describe('getTransactions()', () => {
    it('should fetch transaction history successfully', (done) => {
      const mockResponse = {
        data: [
          mockTransaction,
          {
            transaction_id: 'TXN002',
            from_account: 'ACC001',
            to_account: 'ACC003',
            amount: 500,
            status: 'COMPLETED'
          }
        ]
      };

      service.getTransactions('ACC001').subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.data.length).toBe(2);
          expect(response.data[0].transaction_id).toBe('TXN001');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/tableDetails/ACC001`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should validate account ID is required', (done) => {
      service.getTransactions('').subscribe({
        error: (error) => {
          expect(error.message).toContain('Account ID is required');
          done();
        }
      });
    });

    it('should handle null account ID', (done) => {
      service.getTransactions(null as any).subscribe({
        error: (error) => {
          expect(error.message).toContain('Account ID is required');
          done();
        }
      });
    });

    it('should handle undefined account ID', (done) => {
      service.getTransactions(undefined as any).subscribe({
        error: (error) => {
          expect(error.message).toContain('Account ID is required');
          done();
        }
      });
    });

    it('should trim whitespace from account ID', (done) => {
      const mockResponse = { data: [] };

      service.getTransactions('  ACC001  ').subscribe({
        next: () => {
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/tableDetails/ACC001`);
      req.flush(mockResponse);
    });

    it('should accept numeric account ID', (done) => {
      const mockResponse = { data: [] };

      service.getTransactions(123456).subscribe({
        next: () => {
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/tableDetails/123456`);
      req.flush(mockResponse);
    });

    it('should handle empty transaction history', (done) => {
      const mockResponse = { data: [] };

      service.getTransactions('ACC001').subscribe({
        next: (response) => {
          expect(response.data).toEqual([]);
          expect(response.data.length).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/tableDetails/ACC001`);
      req.flush(mockResponse);
    });

    it('should handle 404 error for non-existent account', (done) => {
      service.getTransactions('INVALID').subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/tableDetails/INVALID`);
        req.flush({ message: 'Account not found' }, { status: 404, statusText: 'Not Found' });
      }
    });

    it('should handle server error', (done) => {
      service.getTransactions('ACC001').subscribe({
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      // Service retries twice, handle 3 requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/tableDetails/ACC001`);
        req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Server Error' });
      }
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      localStorage.setItem('userId', '123');
    });

    it('should log errors to console', (done) => {
      spyOn(console, 'error');

      service.getAccountDetails().subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalled();
          done();
        }
      });

      // Trigger error
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/pageDetails/123`);
        req.flush({ message: 'Error' }, { status: 500, statusText: 'Error' });
      }
    });

    it('should format error messages correctly', (done) => {
      service.getAccountDetails().subscribe({
        error: (error) => {
          expect(error.message).toContain('Test error message');
          done();
        }
      });

      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/pageDetails/123`);
        req.flush({ message: 'Test error message' }, { status: 400, statusText: 'Bad Request' });
      }
    });

    it('should handle client-side ErrorEvent', (done) => {
      service.getAccountDetails().subscribe({
        error: (error) => {
          expect(error.message).toContain('Error: Test client error');
          done();
        }
      });

      // Trigger client-side error with ErrorEvent
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${baseUrl}/api/v1/transaction/pageDetails/123`);
        req.error(new ErrorEvent('Network error', {
          message: 'Test client error'
        }));
      }
    });
  });
});
