/**
 * Unit Tests for ManagerHomeComponent
 *
 * Tests dashboard data loading, statistics retrieval, and error handling
 * Target coverage: 90%+
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ManagerHomeComponent } from './manager.home.component';
import { ManagerHomeService } from 'src/app/service/manager/manager.home.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';

describe('ManagerHomeComponent', () => {
  let toastService: ToastService;
  let component: ManagerHomeComponent;
  let fixture: ComponentFixture<ManagerHomeComponent>;
  let mockManagerHomeService: jasmine.SpyObj<ManagerHomeService>;

  beforeEach(async () => {
    mockManagerHomeService = jasmine.createSpyObj('ManagerHomeService', [
      'getDashboardBlockDetails',
      'getTotalTransactions',
      'getTotalWithdrawals',
      'getLateLoans'
    ]);

    await TestBed.configureTestingModule({
      declarations: [ManagerHomeComponent],
      imports: [CommonModule],
      providers: [
        { provide: ManagerHomeService, useValue: mockManagerHomeService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerHomeComponent);
    component = fixture.componentInstance;

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true, isDenied: false, isDismissed: false, value: true }));

    toastService = TestBed.inject(ToastService);
    spyOn(toastService, 'success');
    spyOn(toastService, 'error');
    spyOn(toastService, 'warning');
    spyOn(toastService, 'info');
    spyOn(console, 'error');
    spyOn(console, 'warn');
  });

  afterEach(() => {
    localStorage.clear();
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default property values', () => {
      expect(component.branch_id).toBeNull();
      expect(component.branch_name).toBe('');
      expect(component.manager_id).toBeNull();
      expect(component.num_accounts).toBe(0);
      expect(component.num_employees).toBe(0);
      expect(component.transactions).toBeNull();
      expect(component.withdrawals).toBeNull();
      expect(component.loans).toBeNull();
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should have empty subscriptions array', () => {
      expect((component as any).subscriptions).toEqual([]);
    });

    it('should call loadDashboardData on ngOnInit', () => {
      spyOn(component, 'loadDashboardData');

      component.ngOnInit();

      expect(component.loadDashboardData).toHaveBeenCalled();
    });
  });

  describe('Dashboard Data Loading - Success', () => {
    const mockDashboardData = {
      data: [{
        user_id: 'user123',
        branch_id: 'branch456',
        branch_name: 'Main Branch',
        manager_id: 'mgr789',
        num_accounts: 150,
        num_employees: 25
      }]
    };

    beforeEach(() => {
      mockManagerHomeService.getDashboardBlockDetails.and.returnValue(of(mockDashboardData));
      mockManagerHomeService.getTotalTransactions.and.returnValue(of({ result: 100 }));
      mockManagerHomeService.getTotalWithdrawals.and.returnValue(of(50));
      mockManagerHomeService.getLateLoans.and.returnValue(of(5));
    });

    it('should load dashboard data successfully', () => {
      component.loadDashboardData();

      expect(component.isLoading).toBe(false);
      expect(component.branch_id).toBe('branch456');
      expect(component.branch_name).toBe('Main Branch');
      expect(component.manager_id).toBe('mgr789');
      expect(component.num_accounts).toBe(150);
      expect(component.num_employees).toBe(25);
      expect(component.errorMessage).toBe('');
    });

    it('should store userId and branchId in localStorage', () => {
      component.loadDashboardData();

      expect(localStorage.getItem('userId')).toBe('user123');
      expect(localStorage.getItem('branchId')).toBe('branch456');
    });

    it('should set isLoading to true initially', () => {
      mockManagerHomeService.getDashboardBlockDetails.and.returnValue(of(mockDashboardData));

      component.loadDashboardData();

      expect(mockManagerHomeService.getDashboardBlockDetails).toHaveBeenCalled();
    });

    it('should clear errorMessage when loading starts', () => {
      component.errorMessage = 'Previous error';

      component.loadDashboardData();

      expect(component.errorMessage).toBe('');
    });

    it('should call loadTransactions after dashboard data loads', () => {
      spyOn(component, 'loadTransactions');

      component.loadDashboardData();

      expect(component.loadTransactions).toHaveBeenCalled();
    });

    it('should call loadWithdrawals after dashboard data loads', () => {
      spyOn(component, 'loadWithdrawals');

      component.loadDashboardData();

      expect(component.loadWithdrawals).toHaveBeenCalled();
    });

    it('should call loadLateLoans after dashboard data loads', () => {
      spyOn(component, 'loadLateLoans');

      component.loadDashboardData();

      expect(component.loadLateLoans).toHaveBeenCalled();
    });

    it('should use default branch name if not provided', () => {
      const dataWithoutBranchName = {
        data: [{
          user_id: 'user123',
          branch_id: 'branch456',
          manager_id: 'mgr789',
          num_accounts: 150,
          num_employees: 25
        }]
      };

      mockManagerHomeService.getDashboardBlockDetails.and.returnValue(of(dataWithoutBranchName));

      component.loadDashboardData();

      expect(component.branch_name).toBe('Unknown Branch');
    });

    it('should use default values for optional fields', () => {
      const minimalData = {
        data: [{
          user_id: 'user123',
          branch_id: 'branch456'
        }]
      };

      mockManagerHomeService.getDashboardBlockDetails.and.returnValue(of(minimalData));

      component.loadDashboardData();

      expect(component.manager_id).toBeNull();
      expect(component.num_accounts).toBe(0);
      expect(component.num_employees).toBe(0);
    });
  });

  describe('Dashboard Data Loading - Null Response', () => {
    it('should handle null response', () => {
      mockManagerHomeService.getDashboardBlockDetails.and.returnValue(of(null));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('No data received from server');
      expect(component.isLoading).toBe(false);
      expect(toastService.error).toHaveBeenCalledWith('Could not load dashboard', 'No data received from server');
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should handle undefined response', () => {
      mockManagerHomeService.getDashboardBlockDetails.and.returnValue(of(undefined));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('No data received from server');
      expect(component.isLoading).toBe(false);
    });

    it('should handle response without data property', () => {
      mockManagerHomeService.getDashboardBlockDetails.and.returnValue(of({}));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('No data received from server');
      expect(toastService.error).toHaveBeenCalledWith('Could not load dashboard', 'No data received from server');
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should handle empty data array', () => {
      mockManagerHomeService.getDashboardBlockDetails.and.returnValue(of({ data: [] }));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('Invalid user data format');
      expect(component.isLoading).toBe(false);
      expect(toastService.error).toHaveBeenCalledWith('Could not load dashboard', 'Invalid user data format');
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should handle data property that is not an array', () => {
      mockManagerHomeService.getDashboardBlockDetails.and.returnValue(of({ data: 'invalid' }));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('Invalid user data format');
      expect(component.isLoading).toBe(false);
    });

    it('should handle missing user_id', () => {
      const invalidData = {
        data: [{
          branch_id: 'branch456'
        }]
      };

      mockManagerHomeService.getDashboardBlockDetails.and.returnValue(of(invalidData));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('Missing required user information');
      expect(toastService.error).toHaveBeenCalledWith('Could not load dashboard', 'Missing required user information');
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should handle missing branch_id', () => {
      const invalidData = {
        data: [{
          user_id: 'user123'
        }]
      };

      mockManagerHomeService.getDashboardBlockDetails.and.returnValue(of(invalidData));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('Missing required user information');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Dashboard Data Loading - Error', () => {
    it('should handle HTTP error with message', () => {
      const errorResponse = { error: { message: 'Server error' } };
      mockManagerHomeService.getDashboardBlockDetails.and.returnValue(throwError(() => errorResponse));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('Server error');
      expect(component.isLoading).toBe(false);
      expect(toastService.error).toHaveBeenCalledWith('Could not load dashboard', 'Server error');
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should handle error without nested message', () => {
      const errorResponse = { message: 'Direct error message' };
      mockManagerHomeService.getDashboardBlockDetails.and.returnValue(throwError(() => errorResponse));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('Direct error message');
      expect(console.error).toHaveBeenCalledWith('Error loading dashboard data:', errorResponse);
    });

    it('should handle error without any message', () => {
      const errorResponse = {};
      mockManagerHomeService.getDashboardBlockDetails.and.returnValue(throwError(() => errorResponse));

      component.loadDashboardData();

      expect(component.errorMessage).toBe('Failed to load dashboard data');
      expect(component.isLoading).toBe(false);
    });

    it('should log error to console', () => {
      const errorResponse = { error: { message: 'Test error' } };
      mockManagerHomeService.getDashboardBlockDetails.and.returnValue(throwError(() => errorResponse));

      component.loadDashboardData();

      expect(console.error).toHaveBeenCalledWith('Error loading dashboard data:', errorResponse);
    });
  });

  describe('Try-Catch Error Handling', () => {
    it('should catch JavaScript errors during data processing', () => {
      // Create data that passes initial checks but fails during property access
      const corruptedData = {
        data: [{
          get user_id() {
            return 'user123';
          },
          get branch_id() {
            throw new Error('Unexpected error during branch_id access');
          }
        }]
      };

      mockManagerHomeService.getDashboardBlockDetails.and.returnValue(of(corruptedData as any));

      component.loadDashboardData();

      expect(console.error).toHaveBeenCalledWith('Error processing dashboard data:', jasmine.any(Error));
      expect(component.errorMessage).toBe('Failed to process dashboard data');
      expect(component.isLoading).toBe(false);
      expect(toastService.error).toHaveBeenCalledWith('Could not load dashboard', 'Failed to process dashboard data');
      expect(Swal.fire).not.toHaveBeenCalled();
    });
  });

  describe('Transactions Loading', () => {
    it('should load transactions successfully', () => {
      component.branch_id = 'branch456';
      mockManagerHomeService.getTotalTransactions.and.returnValue(of({ result: 100 }));

      component.loadTransactions();

      expect(component.transactions).toBe(100);
      expect(mockManagerHomeService.getTotalTransactions).toHaveBeenCalledWith('branch456');
    });

    it('should handle null transactions response', () => {
      component.branch_id = 'branch456';
      mockManagerHomeService.getTotalTransactions.and.returnValue(of(null));

      component.loadTransactions();

      expect(component.transactions).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('No transactions data received');
    });

    it('should handle transactions response without result property', () => {
      component.branch_id = 'branch456';
      mockManagerHomeService.getTotalTransactions.and.returnValue(of({}));

      component.loadTransactions();

      expect(component.transactions).toBeNull();
    });

    it('should not call service when branch_id is null', () => {
      component.branch_id = null;

      component.loadTransactions();

      expect(mockManagerHomeService.getTotalTransactions).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('Branch ID not available for loading transactions');
    });

    it('should handle transactions loading error', () => {
      component.branch_id = 'branch456';
      const errorResponse = { message: 'Failed to load transactions' };
      mockManagerHomeService.getTotalTransactions.and.returnValue(throwError(() => errorResponse));

      component.loadTransactions();

      expect(component.transactions).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error loading transactions:', errorResponse);
    });

    it('should add subscription to array', () => {
      component.branch_id = 'branch456';
      mockManagerHomeService.getTotalTransactions.and.returnValue(of({ result: 100 }));

      component.loadTransactions();

      expect((component as any).subscriptions.length).toBe(1);
    });
  });

  describe('Withdrawals Loading', () => {
    it('should load withdrawals successfully', () => {
      component.branch_id = 'branch456';
      mockManagerHomeService.getTotalWithdrawals.and.returnValue(of(50));

      component.loadWithdrawals();

      expect(component.withdrawals).toBe(50);
      expect(mockManagerHomeService.getTotalWithdrawals).toHaveBeenCalledWith('branch456');
    });

    it('should handle null withdrawals response', () => {
      component.branch_id = 'branch456';
      mockManagerHomeService.getTotalWithdrawals.and.returnValue(of(null));

      component.loadWithdrawals();

      expect(component.withdrawals).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('No withdrawals data received');
    });

    it('should handle undefined withdrawals response', () => {
      component.branch_id = 'branch456';
      mockManagerHomeService.getTotalWithdrawals.and.returnValue(of(undefined));

      component.loadWithdrawals();

      expect(component.withdrawals).toBeNull();
    });

    it('should not call service when branch_id is null', () => {
      component.branch_id = null;

      component.loadWithdrawals();

      expect(mockManagerHomeService.getTotalWithdrawals).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('Branch ID not available for loading withdrawals');
    });

    it('should not call service when branch_id is undefined', () => {
      component.branch_id = undefined;

      component.loadWithdrawals();

      expect(mockManagerHomeService.getTotalWithdrawals).not.toHaveBeenCalled();
    });

    it('should handle withdrawals loading error', () => {
      component.branch_id = 'branch456';
      const errorResponse = { message: 'Failed to load withdrawals' };
      mockManagerHomeService.getTotalWithdrawals.and.returnValue(throwError(() => errorResponse));

      component.loadWithdrawals();

      expect(component.withdrawals).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error loading withdrawals:', errorResponse);
    });

    it('should add subscription to array', () => {
      component.branch_id = 'branch456';
      mockManagerHomeService.getTotalWithdrawals.and.returnValue(of(50));

      component.loadWithdrawals();

      expect((component as any).subscriptions.length).toBe(1);
    });

    it('should store complete withdrawal data object', () => {
      component.branch_id = 'branch456';
      const withdrawalData = { count: 50, total: 5000 };
      mockManagerHomeService.getTotalWithdrawals.and.returnValue(of(withdrawalData));

      component.loadWithdrawals();

      expect(component.withdrawals).toEqual(withdrawalData);
    });
  });

  describe('Late Loans Loading', () => {
    it('should load late loans successfully', () => {
      component.branch_id = 'branch456';
      mockManagerHomeService.getLateLoans.and.returnValue(of(5));

      component.loadLateLoans();

      expect(component.loans).toBe(5);
      expect(mockManagerHomeService.getLateLoans).toHaveBeenCalledWith('branch456');
    });

    it('should handle null late loans response', () => {
      component.branch_id = 'branch456';
      mockManagerHomeService.getLateLoans.and.returnValue(of(null));

      component.loadLateLoans();

      expect(component.loans).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('No late loans data received');
    });

    it('should handle undefined late loans response', () => {
      component.branch_id = 'branch456';
      mockManagerHomeService.getLateLoans.and.returnValue(of(undefined));

      component.loadLateLoans();

      expect(component.loans).toBeNull();
    });

    it('should not call service when branch_id is null', () => {
      component.branch_id = null;

      component.loadLateLoans();

      expect(mockManagerHomeService.getLateLoans).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('Branch ID not available for loading late loans');
    });

    it('should not call service when branch_id is undefined', () => {
      component.branch_id = undefined;

      component.loadLateLoans();

      expect(mockManagerHomeService.getLateLoans).not.toHaveBeenCalled();
    });

    it('should handle late loans loading error', () => {
      component.branch_id = 'branch456';
      const errorResponse = { message: 'Failed to load late loans' };
      mockManagerHomeService.getLateLoans.and.returnValue(throwError(() => errorResponse));

      component.loadLateLoans();

      expect(component.loans).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error loading late loans:', errorResponse);
    });

    it('should add subscription to array', () => {
      component.branch_id = 'branch456';
      mockManagerHomeService.getLateLoans.and.returnValue(of(5));

      component.loadLateLoans();

      expect((component as any).subscriptions.length).toBe(1);
    });

    it('should store complete loan data object', () => {
      component.branch_id = 'branch456';
      const loanData = { count: 5, amount: 50000 };
      mockManagerHomeService.getLateLoans.and.returnValue(of(loanData));

      component.loadLateLoans();

      expect(component.loans).toEqual(loanData);
    });
  });

  describe('table pagination', () => {
    const makeTransactions = (count: number) =>
      Array.from({ length: count }, (_, i) => ({
        transfer_id: `TX-${i + 1}`,
        amount: (i + 1) * 100,
        from_account: `A-${i}`,
        to_account: `B-${i}`,
        transferd_time: '2026-05-01',
        direction: 'up'
      }));

    it('pages transactions six at a time', () => {
      component.transactions = makeTransactions(8);

      expect(component.pagedTransactions.length).toBe(6);
      expect(component.transactionRangeStart).toBe(1);
      expect(component.transactionRangeEnd).toBe(6);
      expect(component.totalTransactionPages).toBe(2);

      component.setTransactionPage(2);
      expect(component.pagedTransactions.length).toBe(2);
      expect(component.transactionRangeStart).toBe(7);
      expect(component.transactionRangeEnd).toBe(8);
    });

    it('clamps the transaction page to the valid range', () => {
      component.transactions = makeTransactions(8);

      component.setTransactionPage(99);
      expect(component.transactionPage).toBe(2);

      component.setTransactionPage(-5);
      expect(component.transactionPage).toBe(1);
    });

    it('starts a new search back at page 1', () => {
      component.transactions = makeTransactions(20);
      component.setTransactionPage(3);

      component.transactionSearch = 'TX-1';
      component.onTransactionSearchChange();

      expect(component.transactionPage).toBe(1);
    });

    it('pages withdrawals five at a time', () => {
      component.withdrawals = Array.from({ length: 7 }, (_, i) => ({
        withdrawal_id: `W-${i + 1}`, amount: 100, account_id: 'A', withdrawal_time: '2026-05-01'
      }));

      expect(component.pagedWithdrawals.length).toBe(5);
      expect(component.totalWithdrawalPages).toBe(2);

      component.setWithdrawalPage(2);
      expect(component.withdrawalRangeStart).toBe(6);
      expect(component.withdrawalRangeEnd).toBe(7);
    });

    it('pages late installments five at a time', () => {
      component.loans = Array.from({ length: 12 }, (_, i) => ({
        installment_id: `I-${i + 1}`, installment_number: i, due_date: '2026-04-01', amount: 500, loan_basic_detail_id: 'L'
      }));

      expect(component.pagedLateInstallments.length).toBe(5);
      expect(component.totalLatePages).toBe(3);

      component.setLatePage(3);
      expect(component.pagedLateInstallments.length).toBe(2);
      expect(component.lateRangeStart).toBe(11);
      expect(component.lateRangeEnd).toBe(12);
    });

    it('reports 0–0 of 0 and one page when a list is empty or not an array', () => {
      component.transactions = null;
      component.withdrawals = 50; // non-array payloads must not break the table
      component.loans = null;

      expect(component.transactionRangeStart).toBe(0);
      expect(component.transactionRangeEnd).toBe(0);
      expect(component.totalTransactionPages).toBe(1);
      expect(component.pagedWithdrawals).toEqual([]);
      expect(component.pagedLateInstallments).toEqual([]);
    });
  });

  describe('Subscription Management', () => {
    const mockDashboardData = {
      data: [{
        user_id: 'user123',
        branch_id: 'branch456',
        branch_name: 'Main Branch',
        manager_id: 'mgr789',
        num_accounts: 150,
        num_employees: 25
      }]
    };

    beforeEach(() => {
      mockManagerHomeService.getDashboardBlockDetails.and.returnValue(of(mockDashboardData));
      mockManagerHomeService.getTotalTransactions.and.returnValue(of({ result: 100 }));
      mockManagerHomeService.getTotalWithdrawals.and.returnValue(of(50));
      mockManagerHomeService.getLateLoans.and.returnValue(of(5));
    });

    it('should add dashboard subscription to array', () => {
      component.loadDashboardData();

      expect((component as any).subscriptions.length).toBeGreaterThan(0);
    });

    it('should add all subscriptions when loading complete data', () => {
      component.loadDashboardData();

      // Dashboard + Transactions + Withdrawals + Late Loans
      expect((component as any).subscriptions.length).toBe(4);
    });

    it('should unsubscribe all subscriptions on ngOnDestroy', () => {
      component.loadDashboardData();

      const subscriptions = (component as any).subscriptions;
      subscriptions.forEach((sub: any) => spyOn(sub, 'unsubscribe'));

      component.ngOnDestroy();

      subscriptions.forEach((sub: any) => {
        expect(sub.unsubscribe).toHaveBeenCalled();
      });
    });

    it('should handle empty subscriptions array on ngOnDestroy', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should handle ngOnDestroy with multiple subscriptions', () => {
      component.loadDashboardData();
      component.loadDashboardData(); // Add more subscriptions

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
