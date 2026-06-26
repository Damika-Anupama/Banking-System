/**
 * Unit Tests for TransactionComponent
 *
 * Tests transaction processing, account management, form validation
 * Target coverage: 90%+
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TransactionComponent } from './transaction.component';
import { TransactionService } from 'src/app/service/customer/transaction.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('TransactionComponent', () => {
  let component: TransactionComponent;
  let fixture: ComponentFixture<TransactionComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockTransactionService: jasmine.SpyObj<TransactionService>;
  let mockChangeDetectorRef: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockTransactionService = jasmine.createSpyObj('TransactionService', [
      'getAccountDetails',
      'getTransactions',
      'proceedTransaction'
    ]);
    mockChangeDetectorRef = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      declarations: [TransactionComponent],
      imports: [CommonModule, FormsModule],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: TransactionService, useValue: mockTransactionService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    // Spy on Swal
    spyOn(Swal, 'fire');
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      mockTransactionService.getAccountDetails.and.returnValue(of({
        data: [{
          account_id: 'ACC001',
          amount: '5000',
          account_type: 'SAVINGS',
          saving_type: 'REGULAR',
          branch_name: 'Main Branch'
        }]
      }));
      mockTransactionService.getTransactions.and.returnValue(of({ data: [] }));

      fixture = TestBed.createComponent(TransactionComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      mockTransactionService.getAccountDetails.and.returnValue(of({
        data: [{
          account_id: 'ACC001',
          amount: '5000',
          account_type: 'SAVINGS',
          saving_type: 'REGULAR',
          branch_name: 'Main Branch'
        }]
      }));
      mockTransactionService.getTransactions.and.returnValue(of({ data: [] }));

      fixture = TestBed.createComponent(TransactionComponent);
      component = fixture.componentInstance;

      expect(component.account_id).toBe('');
      expect(component.balance).toBe('');
      expect(component.account_type).toBe('');
      expect(component.saving_type).toBe('');
      expect(component.branch).toBe('');
      expect(component.accounts).toBeNull();
      expect(component.selectedAccount).toBeNull();
      expect(component.transactions).toBeNull();
      expect(component.cumulativeBalance).toBeNull();
      expect(component.transfer_amount).toBe('');
      expect(component.sender_remarks).toBe('');
      expect(component.beneficiary_remarks).toBe('');
      expect(component.to_account).toBe('');
      expect(component.isLoading).toBe(false);
      expect(component.isLoadingTransactions).toBe(false);
      expect(component.isProcessingTransaction).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should call loadAccountDetails on ngOnInit', () => {
      mockTransactionService.getAccountDetails.and.returnValue(of({
        data: [{
          account_id: 'ACC001',
          amount: '5000',
          account_type: 'SAVINGS',
          saving_type: 'REGULAR',
          branch_name: 'Main Branch'
        }]
      }));
      mockTransactionService.getTransactions.and.returnValue(of({ data: [] }));

      fixture = TestBed.createComponent(TransactionComponent);
      component = fixture.componentInstance;

      spyOn(component, 'loadAccountDetails');
      component.ngOnInit();

      expect(component.loadAccountDetails).toHaveBeenCalled();
    });
  });

  describe('loadAccountDetails() - Successful Loading', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(TransactionComponent);
      component = fixture.componentInstance;
    });

    it('should load account data successfully', () => {
      const mockData = {
        data: [{
          account_id: 'ACC001',
          amount: '5000',
          account_type: 'SAVINGS',
          saving_type: 'REGULAR',
          branch_name: 'Main Branch'
        }]
      };

      mockTransactionService.getAccountDetails.and.returnValue(of(mockData));
      mockTransactionService.getTransactions.and.returnValue(of({ data: [] }));

      component.loadAccountDetails();

      expect(component.isLoading).toBe(false);
      expect(component.accounts).toEqual(mockData.data);
      expect(component.account_id).toBe('ACC001');
      expect(component.balance).toBe('5000');
      expect(component.cumulativeBalance).toBe('5000');
      expect(component.account_type).toBe('SAVINGS');
      expect(component.saving_type).toBe('REGULAR');
      expect(component.branch).toBe('Main Branch');
      expect(component.selectedAccount).toEqual(mockData.data[0]);
      expect(mockTransactionService.getTransactions).toHaveBeenCalledWith('ACC001');
    });

    it('should use default values for missing account fields', () => {
      const mockData = {
        data: [{
          account_id: null,
          amount: null,
          account_type: null,
          saving_type: null,
          branch_name: null
        }]
      };

      mockTransactionService.getAccountDetails.and.returnValue(of(mockData));

      component.loadAccountDetails();

      expect(component.account_id).toBe('');
      expect(component.balance).toBe('0');
      expect(component.account_type).toBe('N/A');
      expect(component.saving_type).toBe('N/A');
      expect(component.branch).toBe('N/A');
    });

    it('should handle multiple accounts', () => {
      const mockData = {
        data: [
          { account_id: 'ACC001', amount: '5000', account_type: 'SAVINGS', saving_type: 'REGULAR', branch_name: 'Branch 1' },
          { account_id: 'ACC002', amount: '10000', account_type: 'CHECKING', saving_type: 'N/A', branch_name: 'Branch 2' }
        ]
      };

      mockTransactionService.getAccountDetails.and.returnValue(of(mockData));
      mockTransactionService.getTransactions.and.returnValue(of({ data: [] }));

      component.loadAccountDetails();

      expect(component.accounts?.length).toBe(2);
      expect(component.account_id).toBe('ACC001'); // First account selected
    });
  });

  describe('loadAccountDetails() - Error Handling', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(TransactionComponent);
      component = fixture.componentInstance;
    });

    it('should handle null response', () => {
      mockTransactionService.getAccountDetails.and.returnValue(of(null));

      component.loadAccountDetails();

      expect(component.errorMessage).toBe('No account data available');
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'No account data available'
        })
      );
    });

    it('should handle missing data property', () => {
      mockTransactionService.getAccountDetails.and.returnValue(of({} as any));

      component.loadAccountDetails();

      expect(component.errorMessage).toBe('No account data available');
    });

    it('should handle empty data array', () => {
      mockTransactionService.getAccountDetails.and.returnValue(of({ data: [] }));

      component.loadAccountDetails();

      expect(component.errorMessage).toBe('No account data available');
    });

    it('should handle non-array data', () => {
      mockTransactionService.getAccountDetails.and.returnValue(of({ data: {} } as any));

      component.loadAccountDetails();

      expect(component.errorMessage).toBe('No account data available');
    });

    it('should handle array with null first element', () => {
      mockTransactionService.getAccountDetails.and.returnValue(of({ data: [null] }));

      component.loadAccountDetails();

      expect(component.errorMessage).toBe('No accounts found');
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'warning',
          title: 'No Accounts',
          text: 'You do not have any accounts yet.'
        })
      );
    });

    it('should handle array with undefined first element', () => {
      mockTransactionService.getAccountDetails.and.returnValue(of({ data: [undefined] }));

      component.loadAccountDetails();

      expect(component.errorMessage).toBe('No accounts found');
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'warning',
          title: 'No Accounts',
          text: 'You do not have any accounts yet.'
        })
      );
    });

    it('should handle server error with message', () => {
      spyOn(console, 'error');
      const errorResponse = {
        error: { message: 'Unauthorized access' }
      };

      mockTransactionService.getAccountDetails.and.returnValue(throwError(() => errorResponse));

      component.loadAccountDetails();

      expect(component.errorMessage).toBe('Unauthorized access');
      expect(component.isLoading).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error loading account details:', errorResponse);
    });

    it('should handle processing error', () => {
      spyOn(console, 'error');
      spyOn(component, 'loadDataToTable').and.throwError('Processing error');

      const mockData = {
        data: [{
          account_id: 'ACC001',
          amount: '5000',
          account_type: 'SAVINGS',
          saving_type: 'REGULAR',
          branch_name: 'Main Branch'
        }]
      };

      mockTransactionService.getAccountDetails.and.returnValue(of(mockData));

      component.loadAccountDetails();

      expect(component.errorMessage).toBe('Failed to process account data');
      expect(console.error).toHaveBeenCalledWith('Error processing account data:', jasmine.any(Error));
    });
  });

  describe('updateSmallBox()', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(TransactionComponent);
      component = fixture.componentInstance;
    });

    it('should update balance and account_id', () => {
      const mockAccount = {
        account_id: 'ACC002',
        amount: '15000',
        account_type: 'CHECKING'
      };

      mockTransactionService.getTransactions.and.returnValue(of({ data: [] }));

      component.updateSmallBox(mockAccount);

      expect(component.balance).toBe('15000');
      expect(component.account_id).toBe('ACC002');
      expect(component.selectedAccount).toEqual(mockAccount);
      expect(mockTransactionService.getTransactions).toHaveBeenCalledWith('ACC002');
    });

    it('should handle account with missing amount', () => {
      const mockAccount = {
        account_id: 'ACC003',
        amount: null
      };

      mockTransactionService.getTransactions.and.returnValue(of({ data: [] }));

      component.updateSmallBox(mockAccount);

      expect(component.balance).toBe('0');
    });

    it('should handle account with missing account_id', () => {
      const mockAccount = {
        account_id: null,
        amount: '5000'
      };

      component.updateSmallBox(mockAccount);

      expect(component.account_id).toBe('');
      expect(mockTransactionService.getTransactions).not.toHaveBeenCalled();
    });

    it('should handle null account gracefully', () => {
      spyOn(console, 'error');

      component.updateSmallBox(null);

      expect(console.error).toHaveBeenCalledWith('Invalid account selected');
    });
  });

  describe('proceedTransaction() - Validation', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(TransactionComponent);
      component = fixture.componentInstance;
    });

    it('should reject empty required fields', () => {
      component.account_id = '';
      component.to_account = '';
      component.transfer_amount = '';

      component.proceedTransaction();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please fill in all required fields (Account, To Account, Amount)'
        })
      );
      expect(mockTransactionService.proceedTransaction).not.toHaveBeenCalled();
    });

    it('should reject missing account_id', () => {
      component.account_id = '';
      component.to_account = 'ACC002';
      component.transfer_amount = '1000';

      component.proceedTransaction();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please fill in all required fields (Account, To Account, Amount)'
        })
      );
    });

    it('should reject invalid amount (non-numeric)', () => {
      component.account_id = 'ACC001';
      component.to_account = 'ACC002';
      component.transfer_amount = 'invalid';

      component.proceedTransaction();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please enter a valid positive amount'
        })
      );
    });

    it('should reject negative amount', () => {
      component.account_id = 'ACC001';
      component.to_account = 'ACC002';
      component.transfer_amount = '-100';

      component.proceedTransaction();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please enter a valid positive amount'
        })
      );
    });

    it('should reject zero amount', () => {
      component.account_id = 'ACC001';
      component.to_account = 'ACC002';
      component.transfer_amount = '0';

      component.proceedTransaction();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please enter a valid positive amount'
        })
      );
    });

    it('should reject transfer exceeding balance', () => {
      component.account_id = 'ACC001';
      component.to_account = 'ACC002';
      component.balance = '500';
      component.transfer_amount = '1000';

      component.proceedTransaction();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Insufficient Balance',
          text: 'Transfer amount exceeds available balance'
        })
      );
    });

    it('should reject transfer to same account', () => {
      component.account_id = 'ACC001';
      component.to_account = 'ACC001';
      component.balance = '5000';
      component.transfer_amount = '1000';

      component.proceedTransaction();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Invalid Transfer',
          text: 'Cannot transfer to the same account'
        })
      );
    });
  });

  describe('proceedTransaction() - Successful Transaction', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(TransactionComponent);
      component = fixture.componentInstance;
    });

    it('should process transaction successfully', () => {
      component.account_id = 'ACC001';
      component.to_account = 'ACC002';
      component.balance = '5000';
      component.transfer_amount = '1000';
      component.sender_remarks = 'Test payment';
      component.beneficiary_remarks = 'Thank you';

      const mockResponse = { message: 'Transfer created successfully!' };
      mockTransactionService.proceedTransaction.and.returnValue(of(mockResponse));
      mockTransactionService.getTransactions.and.returnValue(of({ data: [] }));

      component.proceedTransaction();

      expect(mockTransactionService.proceedTransaction).toHaveBeenCalledWith(
        'ACC001',
        'ACC002',
        '1000',
        'Test payment',
        'Thank you'
      );
      expect(component.balance).toBe('4000');
      expect(component.transfer_amount).toBe('');
      expect(component.sender_remarks).toBe('');
      expect(component.beneficiary_remarks).toBe('');
      expect(component.to_account).toBe('');
      expect(component.isProcessingTransaction).toBe(false);
    });

    it('should update balance correctly', () => {
      component.account_id = 'ACC001';
      component.to_account = 'ACC002';
      component.balance = '10000';
      component.transfer_amount = '2500';

      const mockResponse = { message: 'Transfer created successfully!' };
      mockTransactionService.proceedTransaction.and.returnValue(of(mockResponse));
      mockTransactionService.getTransactions.and.returnValue(of({ data: [] }));

      component.proceedTransaction();

      expect(component.balance).toBe('7500');
    });

    it('should reload transactions after successful transfer', () => {
      component.account_id = 'ACC001';
      component.to_account = 'ACC002';
      component.balance = '5000';
      component.transfer_amount = '1000';

      const mockResponse = { message: 'Transfer created successfully!' };
      mockTransactionService.proceedTransaction.and.returnValue(of(mockResponse));
      mockTransactionService.getTransactions.and.returnValue(of({ data: [] }));

      component.proceedTransaction();

      expect(mockTransactionService.getTransactions).toHaveBeenCalledWith('ACC001');
    });
  });

  describe('proceedTransaction() - Error Handling', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(TransactionComponent);
      component = fixture.componentInstance;
    });

    it('should handle server error', () => {
      spyOn(console, 'error');
      component.account_id = 'ACC001';
      component.to_account = 'ACC002';
      component.balance = '5000';
      component.transfer_amount = '1000';

      const errorResponse = {
        error: { message: 'Insufficient funds' }
      };

      mockTransactionService.proceedTransaction.and.returnValue(throwError(() => errorResponse));

      component.proceedTransaction();

      expect(component.errorMessage).toBe('Insufficient funds');
      expect(component.isProcessingTransaction).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error processing transaction:', errorResponse);
    });

    it('should handle processing error', () => {
      spyOn(console, 'error');
      component.account_id = 'ACC001';
      component.to_account = 'ACC002';
      component.balance = '5000';
      component.transfer_amount = '1000';

      mockTransactionService.proceedTransaction.and.returnValue(of(null));
      spyOn(component, 'showToast').and.throwError('Processing error');

      component.proceedTransaction();

      expect(component.isProcessingTransaction).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Failed to process transaction response'
        })
      );
    });
  });

  describe('showToast()', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(TransactionComponent);
      component = fixture.componentInstance;
    });

    it('should show success toast for successful transfer', () => {
      const data = { message: 'Transfer created successfully!' };

      component.showToast(data);

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Success',
          text: 'Transfer created successfully!',
          icon: 'success'
        })
      );
    });

    it('should show error toast for failed transfer', () => {
      const data = { message: 'Transfer failed' };

      component.showToast(data);

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Error',
          text: 'Transfer failed',
          icon: 'error'
        })
      );
    });

    it('should handle null data', () => {
      component.showToast(null);

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Error',
          text: 'Invalid response from server',
          icon: 'error'
        })
      );
    });

    it('should use default message when message is missing', () => {
      const data = {};

      component.showToast(data);

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Error',
          text: 'Transaction failed',
          icon: 'error'
        })
      );
    });
  });

  describe('loadDataToTable()', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(TransactionComponent);
      component = fixture.componentInstance;
    });

    it('should load transactions successfully', () => {
      const mockTransactions = {
        data: [
          { id: '1', amount: '1000', date: '2024-01-01' },
          { id: '2', amount: '500', date: '2024-01-02' }
        ]
      };

      mockTransactionService.getTransactions.and.returnValue(of(mockTransactions));

      component.loadDataToTable('ACC001');

      expect(component.transactions).toEqual(mockTransactions.data);
      expect(component.isLoadingTransactions).toBe(false);
    });

    it('should handle null response', () => {
      mockTransactionService.getTransactions.and.returnValue(of(null));

      component.loadDataToTable('ACC001');

      expect(component.transactions).toEqual([]);
      expect(component.isLoadingTransactions).toBe(false);
    });

    it('should handle missing data property', () => {
      mockTransactionService.getTransactions.and.returnValue(of({} as any));

      component.loadDataToTable('ACC001');

      expect(component.transactions).toEqual([]);
    });

    it('should handle non-array data', () => {
      mockTransactionService.getTransactions.and.returnValue(of({ data: {} } as any));

      component.loadDataToTable('ACC001');

      expect(component.transactions).toEqual([]);
    });

    it('should handle server error silently', () => {
      spyOn(console, 'error');
      const error = new Error('Network error');

      mockTransactionService.getTransactions.and.returnValue(throwError(() => error));

      component.loadDataToTable('ACC001');

      expect(component.transactions).toEqual([]);
      expect(component.isLoadingTransactions).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error loading transactions:', error);
      expect(Swal.fire).not.toHaveBeenCalled(); // Silent failure
    });

    it('should not load transactions with invalid account ID', () => {
      spyOn(console, 'error');

      component.loadDataToTable(null);

      expect(console.error).toHaveBeenCalledWith('Invalid account ID');
      expect(mockTransactionService.getTransactions).not.toHaveBeenCalled();
    });

    it('should not load transactions with empty account ID', () => {
      spyOn(console, 'error');

      component.loadDataToTable('');

      expect(console.error).toHaveBeenCalledWith('Invalid account ID');
      expect(mockTransactionService.getTransactions).not.toHaveBeenCalled();
    });
  });

  describe('Subscription Management', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(TransactionComponent);
      component = fixture.componentInstance;
    });

    it('should unsubscribe all subscriptions on ngOnDestroy', () => {
      const mockData = {
        data: [{
          account_id: 'ACC001',
          amount: '5000',
          account_type: 'SAVINGS',
          saving_type: 'REGULAR',
          branch_name: 'Main Branch'
        }]
      };

      mockTransactionService.getAccountDetails.and.returnValue(of(mockData));
      mockTransactionService.getTransactions.and.returnValue(of({ data: [] }));

      component.loadAccountDetails();

      const subscription = (component as any).subscriptions[0];
      spyOn(subscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(subscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(TransactionComponent);
      component = fixture.componentInstance;
    });

    it('should handle decimal transfer amounts', () => {
      component.account_id = 'ACC001';
      component.to_account = 'ACC002';
      component.balance = '5000';
      component.transfer_amount = '999.99';

      const mockResponse = { message: 'Transfer created successfully!' };
      mockTransactionService.proceedTransaction.and.returnValue(of(mockResponse));
      mockTransactionService.getTransactions.and.returnValue(of({ data: [] }));

      component.proceedTransaction();

      expect(component.balance).toBe('4000.01');
    });

    it('should handle transfer of entire balance', () => {
      component.account_id = 'ACC001';
      component.to_account = 'ACC002';
      component.balance = '1000';
      component.transfer_amount = '1000';

      const mockResponse = { message: 'Transfer created successfully!' };
      mockTransactionService.proceedTransaction.and.returnValue(of(mockResponse));
      mockTransactionService.getTransactions.and.returnValue(of({ data: [] }));

      component.proceedTransaction();

      expect(component.balance).toBe('0');
    });

    it('should handle optional remarks fields', () => {
      component.account_id = 'ACC001';
      component.to_account = 'ACC002';
      component.balance = '5000';
      component.transfer_amount = '1000';
      component.sender_remarks = '';
      component.beneficiary_remarks = '';

      const mockResponse = { message: 'Transfer created successfully!' };
      mockTransactionService.proceedTransaction.and.returnValue(of(mockResponse));
      mockTransactionService.getTransactions.and.returnValue(of({ data: [] }));

      component.proceedTransaction();

      expect(mockTransactionService.proceedTransaction).toHaveBeenCalledWith(
        'ACC001',
        'ACC002',
        '1000',
        '',
        ''
      );
    });
  });
});
