/**
 * Test Helpers and Utilities
 *
 * Common testing utilities, mocks, and helpers used across test files.
 */

import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Creates a mock HttpErrorResponse for testing error scenarios
 */
export function createMockHttpError(status: number, statusText: string, message?: string): HttpErrorResponse {
  return new HttpErrorResponse({
    error: { message: message || 'Test error' },
    status,
    statusText,
    url: 'http://localhost:3000/api/v1/test'
  });
}

/**
 * Mock user data for testing
 */
export const mockUser = {
  user_id: '1',
  username: 'testuser',
  email: 'test@example.com',
  fullname: 'Test User',
  gender: 'MALE',
  contact_no: '1234567890',
  type: 'CUSTOMER',
  accounts: [
    {
      account_id: 'ACC001',
      account_type: 'SAVINGS',
      saving_type: 'STANDARD',
      amount: 10000,
      branch_name: 'Main Branch',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    }
  ]
};

/**
 * Mock auth response for testing
 */
export const mockAuthResponse = {
  token: 'mock-jwt-token-123456789',
  type: 'CUSTOMER'
};

/**
 * Mock transaction data for testing
 */
export const mockTransaction = {
  transaction_id: 'TXN001',
  from_account: 'ACC001',
  to_account: 'ACC002',
  amount: 1000,
  sender_remarks: 'Test payment',
  beneficiary_remarks: 'Received',
  timestamp: new Date('2024-01-01'),
  status: 'COMPLETED'
};

/**
 * Mock loan data for testing
 */
export const mockLoan = {
  loan_id: 'LOAN001',
  account_id: 'ACC001',
  loan_type: 'PERSONAL',
  amount: 50000,
  interest_rate: 10.5,
  duration_months: 12,
  status: 'APPROVED',
  created_at: new Date('2024-01-01')
};

/**
 * Mock fixed deposit data for testing
 */
export const mockFixedDeposit = {
  fd_id: 'FD001',
  account_id: 'ACC001',
  amount: 100000,
  interest_rate: 8.5,
  duration_months: 12,
  maturity_date: new Date('2025-01-01'),
  status: 'ACTIVE'
};

/**
 * Spy helper for async operations
 */
export function createAsyncSpy<T>(returnValue: T) {
  return jasmine.createSpy().and.returnValue(of(returnValue));
}

/**
 * Spy helper for async errors
 */
export function createAsyncErrorSpy(error: any) {
  return jasmine.createSpy().and.returnValue(throwError(() => error));
}

/**
 * Delay helper for testing async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock localStorage for testing
 */
export class MockLocalStorage {
  private storage: { [key: string]: string } = {};

  getItem(key: string): string | null {
    return this.storage[key] || null;
  }

  setItem(key: string, value: string): void {
    this.storage[key] = value;
  }

  removeItem(key: string): void {
    delete this.storage[key];
  }

  clear(): void {
    this.storage = {};
  }

  get length(): number {
    return Object.keys(this.storage).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.storage);
    return keys[index] || null;
  }
}

/**
 * Mock Router for testing navigation
 */
export class MockRouter {
  navigate = jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true));
  navigateByUrl = jasmine.createSpy('navigateByUrl').and.returnValue(Promise.resolve(true));
  url = '/';
}

/**
 * Wait for async operations in tests
 */
export async function waitForAsync(fn: () => void, maxWait = 1000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    try {
      fn();
      return;
    } catch (e) {
      await delay(50);
    }
  }

  throw new Error('waitForAsync timeout exceeded');
}

/**
 * Create mock Swal for testing
 */
export const mockSwal = {
  fire: jasmine.createSpy('fire').and.returnValue(Promise.resolve({ isConfirmed: true })),
  close: jasmine.createSpy('close')
};
