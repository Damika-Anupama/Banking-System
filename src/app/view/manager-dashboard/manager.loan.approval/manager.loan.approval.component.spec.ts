/**
 * Unit Tests for ManagerLoanApprovalComponent
 *
 * Tests loan approval workflow, rejection with reasons, and error handling
 * Target coverage: 90%+
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ManagerLoanApprovalComponent } from './manager.loan.approval.component';
import { LoanApprovalService } from 'src/app/service/manager/loan.approval.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';

describe('ManagerLoanApprovalComponent', () => {
  let component: ManagerLoanApprovalComponent;
  let fixture: ComponentFixture<ManagerLoanApprovalComponent>;
  let mockLoanApprovalService: jasmine.SpyObj<LoanApprovalService>;
  let toastService: ToastService;

  beforeEach(async () => {
    mockLoanApprovalService = jasmine.createSpyObj('LoanApprovalService', ['getUnapprovedLoans']);

    await TestBed.configureTestingModule({
      declarations: [ManagerLoanApprovalComponent],
      imports: [CommonModule],
      providers: [
        { provide: LoanApprovalService, useValue: mockLoanApprovalService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerLoanApprovalComponent);
    component = fixture.componentInstance;

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true, isDenied: false, isDismissed: false, value: true }));
    spyOn(console, 'error');

    toastService = TestBed.inject(ToastService);
    spyOn(toastService, 'success');
    spyOn(toastService, 'error');
    spyOn(toastService, 'warning');
    spyOn(toastService, 'info');
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with null loans array', () => {
      expect(component.loans).toBeNull();
    });

    it('should initialize with isLoading false', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should initialize with empty errorMessage', () => {
      expect(component.errorMessage).toBe('');
    });

    it('should have empty subscriptions array', () => {
      expect((component as any).subscriptions).toEqual([]);
    });

    it('should call loadUnapprovedLoans on ngOnInit', () => {
      spyOn(component, 'loadUnapprovedLoans');

      component.ngOnInit();

      expect(component.loadUnapprovedLoans).toHaveBeenCalled();
    });
  });

  describe('Load Unapproved Loans - Success', () => {
    const mockLoans = {
      data: [
        { loan_id: 1, customer_name: 'John Doe', amount: 10000, status: 'PENDING' },
        { loan_id: 2, customer_name: 'Jane Smith', amount: 20000, status: 'PENDING' }
      ]
    };

    it('should load unapproved loans successfully', () => {
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(of(mockLoans));

      component.loadUnapprovedLoans();

      expect(component.loans).toEqual(mockLoans.data);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should set isLoading to true initially', () => {
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(of(mockLoans));

      component.loadUnapprovedLoans();

      expect(mockLoanApprovalService.getUnapprovedLoans).toHaveBeenCalled();
    });

    it('should clear errorMessage when loading starts', () => {
      component.errorMessage = 'Previous error';
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(of(mockLoans));

      component.loadUnapprovedLoans();

      expect(component.errorMessage).toBe('');
    });

    it('does not pop a dialog for an empty queue, which the table already states inline', () => {
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(of({ data: [] }));

      component.loadUnapprovedLoans();

      expect(component.loans).toEqual([]);
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).not.toHaveBeenCalled();
      expect(toastService.info).not.toHaveBeenCalled();
    });

    it('should not show Swal when loans are present', () => {
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(of(mockLoans));

      component.loadUnapprovedLoans();

      expect(Swal.fire).not.toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'info',
          title: 'No Pending Loans'
        })
      );
    });
  });

  describe('Load Unapproved Loans - Null Response', () => {
    it('should handle null response', () => {
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(of(null));

      component.loadUnapprovedLoans();

      expect(component.errorMessage).toBe('No data received from server');
      expect(component.isLoading).toBe(false);
      expect(toastService.error).toHaveBeenCalledWith(
        'Could not load loans',
        'No data received from server'
      );
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should handle undefined response', () => {
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(of(undefined));

      component.loadUnapprovedLoans();

      expect(component.errorMessage).toBe('No data received from server');
      expect(component.isLoading).toBe(false);
    });

    it('should handle response without data property', () => {
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(of({}));

      component.loadUnapprovedLoans();

      expect(component.errorMessage).toBe('Invalid data format received');
      expect(component.loans).toEqual([]);
      expect(toastService.warning).toHaveBeenCalledWith('No loan data', 'No loan data available.');
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should handle data property that is not an array', () => {
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(of({ data: 'invalid' }));

      component.loadUnapprovedLoans();

      expect(component.errorMessage).toBe('Invalid data format received');
      expect(component.loans).toEqual([]);
      expect(component.isLoading).toBe(false);
    });

    it('should handle data property that is null', () => {
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(of({ data: null }));

      component.loadUnapprovedLoans();

      expect(component.errorMessage).toBe('Invalid data format received');
      expect(component.loans).toEqual([]);
    });
  });

  describe('Load Unapproved Loans - Error', () => {
    it('should handle HTTP error with message', () => {
      const errorResponse = { error: { message: 'Server error' } };
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(throwError(() => errorResponse));

      component.loadUnapprovedLoans();

      expect(component.errorMessage).toBe('Server error');
      expect(component.isLoading).toBe(false);
      expect(toastService.error).toHaveBeenCalledWith('Could not load loans', 'Server error');
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should handle error without nested message', () => {
      const errorResponse = { message: 'Direct error message' };
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(throwError(() => errorResponse));

      component.loadUnapprovedLoans();

      expect(component.errorMessage).toBe('Direct error message');
      expect(console.error).toHaveBeenCalledWith('Error loading unapproved loans:', errorResponse);
    });

    it('should handle error without any message', () => {
      const errorResponse = {};
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(throwError(() => errorResponse));

      component.loadUnapprovedLoans();

      expect(component.errorMessage).toBe('Failed to load unapproved loans');
      expect(component.isLoading).toBe(false);
    });

    it('should log error to console', () => {
      const errorResponse = { error: { message: 'Test error' } };
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(throwError(() => errorResponse));

      component.loadUnapprovedLoans();

      expect(console.error).toHaveBeenCalledWith('Error loading unapproved loans:', errorResponse);
    });
  });

  describe('Try-Catch Error Handling', () => {
    it('should catch JavaScript errors during data processing', () => {
      // Create data that will throw an error when accessed
      const problematicData = {
        get data() {
          throw new Error('Unexpected data processing error');
        }
      };

      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(of(problematicData));

      component.loadUnapprovedLoans();

      expect(console.error).toHaveBeenCalledWith('Error processing loan data:', jasmine.any(Error));
      expect(component.errorMessage).toBe('Failed to process loan data');
      expect(component.isLoading).toBe(false);
      expect(toastService.error).toHaveBeenCalledWith(
        'Could not load loans',
        'Failed to process loan data'
      );
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should handle TypeError during data processing', () => {
      const dataWithTypeError = {
        get data() {
          throw new TypeError('Cannot read property of undefined');
        }
      };

      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(of(dataWithTypeError));

      component.loadUnapprovedLoans();

      expect(console.error).toHaveBeenCalledWith('Error processing loan data:', jasmine.any(TypeError));
      expect(component.errorMessage).toBe('Failed to process loan data');
      expect(component.isLoading).toBe(false);
    });

    it('should handle ReferenceError during data processing', () => {
      const dataWithReferenceError = {
        get data() {
          throw new ReferenceError('Variable is not defined');
        }
      };

      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(of(dataWithReferenceError));

      component.loadUnapprovedLoans();

      expect(console.error).toHaveBeenCalledWith('Error processing loan data:', jasmine.any(ReferenceError));
      expect(toastService.error).toHaveBeenCalledWith(
        'Could not load loans',
        'Failed to process loan data'
      );
      expect(Swal.fire).not.toHaveBeenCalled();
    });
  });

  describe('Approve Loan - Validation', () => {
    it('should reject when loanId is null', () => {
      component.approve(null);

      expect(toastService.error).toHaveBeenCalledWith('Cannot proceed', 'Loan ID is missing.');
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should reject when loanId is undefined', () => {
      component.approve(undefined);

      expect(toastService.error).toHaveBeenCalledWith('Cannot proceed', 'Loan ID is missing.');
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should reject when loanId is empty string', () => {
      component.approve('');

      expect(toastService.error).toHaveBeenCalledWith('Cannot proceed', 'Loan ID is missing.');
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should reject when no parameter is passed', () => {
      component.approve();

      expect(toastService.error).toHaveBeenCalledWith('Cannot proceed', 'Loan ID is missing.');
      expect(Swal.fire).not.toHaveBeenCalled();
    });
  });

  describe('Approve Loan - Confirmation Dialog', () => {
    it('should show confirmation dialog with valid loanId', () => {
      component.approve(123);

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Approve Loan',
          text: 'Are you sure you want to approve this loan?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, approve it!',
          cancelButtonText: 'Cancel'
        })
      );
    });

    it('should call processApproval when confirmed', async () => {
      (Swal.fire as jasmine.Spy).and.returnValue(
        Promise.resolve({ isConfirmed: true, isDenied: false, isDismissed: false, value: true })
      );

      spyOn<any>(component, 'processApproval');

      component.approve(123);
      await Promise.resolve();

      expect((component as any).processApproval).toHaveBeenCalledWith(123);
    });

    it('should not call processApproval when cancelled', async () => {
      (Swal.fire as jasmine.Spy).and.returnValue(
        Promise.resolve({ isConfirmed: false, isDenied: false, isDismissed: true, value: false })
      );

      spyOn<any>(component, 'processApproval');

      component.approve(123);
      await Promise.resolve();

      expect((component as any).processApproval).not.toHaveBeenCalled();
    });
  });

  describe('Reject Loan - Validation', () => {
    it('should reject when loanId is null', () => {
      component.reject(null);

      expect(toastService.error).toHaveBeenCalledWith('Cannot proceed', 'Loan ID is missing.');
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should reject when loanId is undefined', () => {
      component.reject(undefined);

      expect(toastService.error).toHaveBeenCalledWith('Cannot proceed', 'Loan ID is missing.');
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should reject when loanId is empty string', () => {
      component.reject('');

      expect(toastService.error).toHaveBeenCalledWith('Cannot proceed', 'Loan ID is missing.');
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should reject when no parameter is passed', () => {
      component.reject();

      expect(toastService.error).toHaveBeenCalledWith('Cannot proceed', 'Loan ID is missing.');
      expect(Swal.fire).not.toHaveBeenCalled();
    });
  });

  describe('Reject Loan - Confirmation Dialog', () => {
    it('should show confirmation dialog with reason input', () => {
      component.reject(123);

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Reject Loan',
          text: 'Are you sure you want to reject this loan?',
          input: 'textarea',
          inputLabel: 'Rejection Reason',
          inputPlaceholder: 'Enter reason for rejection...',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Yes, reject it!',
          cancelButtonText: 'Cancel'
        })
      );
    });

    it('should have inputValidator function', () => {
      component.reject(123);

      const swalCallArgs = (Swal.fire as jasmine.Spy).calls.mostRecent().args[0];
      expect(swalCallArgs.inputValidator).toBeDefined();
    });

    it('should validate empty reason', () => {
      component.reject(123);

      const swalCallArgs = (Swal.fire as jasmine.Spy).calls.mostRecent().args[0];
      const validator = swalCallArgs.inputValidator;

      const result = validator('');
      expect(result).toBe('Please provide a reason for rejection');
    });

    it('should validate whitespace-only reason', () => {
      component.reject(123);

      const swalCallArgs = (Swal.fire as jasmine.Spy).calls.mostRecent().args[0];
      const validator = swalCallArgs.inputValidator;

      const result = validator('   ');
      expect(result).toBe('Please provide a reason for rejection');
    });

    it('should accept valid reason', () => {
      component.reject(123);

      const swalCallArgs = (Swal.fire as jasmine.Spy).calls.mostRecent().args[0];
      const validator = swalCallArgs.inputValidator;

      const result = validator('Insufficient income');
      expect(result).toBeNull();
    });

    it('should call processRejection when confirmed with reason', async () => {
      (Swal.fire as jasmine.Spy).and.returnValue(
        Promise.resolve({ isConfirmed: true, value: 'Insufficient income', isDenied: false, isDismissed: false })
      );

      spyOn<any>(component, 'processRejection');

      component.reject(123);
      await Promise.resolve();

      expect((component as any).processRejection).toHaveBeenCalledWith(123, 'Insufficient income');
    });

    it('should not call processRejection when cancelled', async () => {
      (Swal.fire as jasmine.Spy).and.returnValue(
        Promise.resolve({ isConfirmed: false, isDenied: false, isDismissed: true, value: false })
      );

      spyOn<any>(component, 'processRejection');

      component.reject(123);
      await Promise.resolve();

      expect((component as any).processRejection).not.toHaveBeenCalled();
    });

    it('should not call processRejection when confirmed without value', async () => {
      (Swal.fire as jasmine.Spy).and.returnValue(
        Promise.resolve({ isConfirmed: true, value: null, isDenied: false, isDismissed: false })
      );

      spyOn<any>(component, 'processRejection');

      component.reject(123);
      await Promise.resolve();

      expect((component as any).processRejection).not.toHaveBeenCalled();
    });
  });

  describe('Private Method - processApproval', () => {
    it('should approve the loan and show a success message', () => {
      const before = component.approvedCount;

      (component as any).processApproval(123);

      expect(component.approvedCount).toBe(before + 1);
      expect(toastService.success).toHaveBeenCalledWith(
        'Loan approved',
        jasmine.stringMatching('removed from the queue')
      );
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should not throw error when called', () => {
      expect(() => (component as any).processApproval(123)).not.toThrow();
    });

    it('should accept any loanId type', () => {
      expect(() => (component as any).processApproval('loan123')).not.toThrow();
      expect(() => (component as any).processApproval(456)).not.toThrow();
    });
  });

  describe('Private Method - processRejection', () => {
    it('should reject the loan and show a success message', () => {
      const before = component.rejectedCount;

      (component as any).processRejection(123, 'Test reason');

      expect(component.rejectedCount).toBe(before + 1);
      expect(toastService.success).toHaveBeenCalledWith(
        'Loan rejected',
        jasmine.stringMatching('has been rejected')
      );
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should not throw error when called', () => {
      expect(() => (component as any).processRejection(123, 'Test reason')).not.toThrow();
    });

    it('should accept any loanId type', () => {
      expect(() => (component as any).processRejection('loan123', 'Reason')).not.toThrow();
      expect(() => (component as any).processRejection(456, 'Reason')).not.toThrow();
    });

    it('should accept any reason string', () => {
      expect(() => (component as any).processRejection(123, 'Short')).not.toThrow();
      expect(() => (component as any).processRejection(123, 'Very long rejection reason with multiple sentences')).not.toThrow();
    });
  });

  describe('blocking vs non-blocking feedback', () => {
    it('still asks the manager to confirm before approving', () => {
      component.approve('LN-1001');

      // Approving a loan is irreversible, so this one stays modal.
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({ title: 'Approve Loan' })
      );
    });

    it('still asks the manager to confirm, with a reason, before rejecting', () => {
      component.reject('LN-1001');

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({ title: 'Reject Loan', input: 'textarea' })
      );
    });

    it('does not block on a missing loan id', () => {
      component.approve(undefined);

      expect(toastService.error).toHaveBeenCalledWith('Cannot proceed', 'Loan ID is missing.');
      expect(Swal.fire).not.toHaveBeenCalled();
    });
  });

  describe('sorting the approval queue', () => {
    beforeEach(() => {
      component.loans = [
        { loan_basic_detail_id: 'LN-1', customer_id: 'CUS-3', amount: 500,  interest: 13, duration_days: 180 },
        { loan_basic_detail_id: 'LN-2', customer_id: 'CUS-1', amount: 9000, interest: 15, duration_days: 360 },
        { loan_basic_detail_id: 'LN-3', customer_id: 'CUS-2', amount: 100,  interest: 14, duration_days: 90 },
      ];
    });

    const amounts = () => component.filteredLoans.map((l: any) => l.amount);

    it('leaves the queue in its own order until asked to sort', () => {
      expect(amounts()).toEqual([500, 9000, 100]);
    });

    it('sorts by amount, largest first — the manager triages big loans', () => {
      component.toggleSort('amount');

      expect(amounts()).toEqual([9000, 500, 100]);
    });

    it('cycles back to the queue order on a third click', () => {
      component.toggleSort('amount');
      component.toggleSort('amount');
      component.toggleSort('amount');

      expect(component.sort.column).toBeNull();
      expect(amounts()).toEqual([500, 9000, 100]);
    });

    it('sorts and searches together, rather than one replacing the other', () => {
      component.searchTerm = 'CUS';
      component.toggleSort('amount');

      expect(amounts()).toEqual([9000, 500, 100]);
    });

    it('exposes the sort state for assistive tech', () => {
      expect(component.sort.stateFor('amount')).toBe('none');

      component.toggleSort('amount');
      expect(component.sort.stateFor('amount')).toBe('descending');
    });
  });

  describe('Subscription Management', () => {
    const mockLoans = {
      data: [
        { loan_id: 1, customer_name: 'John Doe', amount: 10000, status: 'PENDING' }
      ]
    };

    it('should add subscription to array when loading loans', () => {
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(of(mockLoans));

      component.loadUnapprovedLoans();

      expect((component as any).subscriptions.length).toBe(1);
    });

    it('should add multiple subscriptions when called multiple times', () => {
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(of(mockLoans));

      component.loadUnapprovedLoans();
      component.loadUnapprovedLoans();

      expect((component as any).subscriptions.length).toBe(2);
    });

    it('should unsubscribe all subscriptions on ngOnDestroy', () => {
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(of(mockLoans));

      component.loadUnapprovedLoans();

      const subscriptions = (component as any).subscriptions;
      const sub = subscriptions[0];
      spyOn(sub, 'unsubscribe');

      component.ngOnDestroy();

      expect(sub.unsubscribe).toHaveBeenCalled();
    });

    it('should handle empty subscriptions array on ngOnDestroy', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should unsubscribe multiple subscriptions on ngOnDestroy', () => {
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(of(mockLoans));

      component.loadUnapprovedLoans();
      component.loadUnapprovedLoans();

      const subscriptions = (component as any).subscriptions;
      subscriptions.forEach((sub: any) => spyOn(sub, 'unsubscribe'));

      component.ngOnDestroy();

      subscriptions.forEach((sub: any) => {
        expect(sub.unsubscribe).toHaveBeenCalled();
      });
    });
  });
});
