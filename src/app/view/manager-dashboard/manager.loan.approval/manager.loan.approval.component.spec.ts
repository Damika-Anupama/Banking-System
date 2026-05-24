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

describe('ManagerLoanApprovalComponent', () => {
  let component: ManagerLoanApprovalComponent;
  let fixture: ComponentFixture<ManagerLoanApprovalComponent>;
  let mockLoanApprovalService: jasmine.SpyObj<LoanApprovalService>;

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

    it('should handle empty loans array and show info message', () => {
      mockLoanApprovalService.getUnapprovedLoans.and.returnValue(of({ data: [] }));

      component.loadUnapprovedLoans();

      expect(component.loans).toEqual([]);
      expect(component.isLoading).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'info',
          title: 'No Pending Loans',
          text: 'There are no pending loan approvals at this time'
        })
      );
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
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'No data received from server'
        })
      );
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
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'warning',
          title: 'Warning',
          text: 'No loan data available'
        })
      );
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
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Server error'
        })
      );
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
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Failed to process loan data'
        })
      );
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
      expect(Swal.fire).toHaveBeenCalled();
    });
  });

  describe('Approve Loan - Validation', () => {
    it('should reject when loanId is null', () => {
      component.approve(null);

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Loan ID is missing'
        })
      );
    });

    it('should reject when loanId is undefined', () => {
      component.approve(undefined);

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Loan ID is missing'
        })
      );
    });

    it('should reject when loanId is empty string', () => {
      component.approve('');

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Loan ID is missing'
        })
      );
    });

    it('should reject when no parameter is passed', () => {
      component.approve();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Loan ID is missing'
        })
      );
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

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Loan ID is missing'
        })
      );
    });

    it('should reject when loanId is undefined', () => {
      component.reject(undefined);

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Loan ID is missing'
        })
      );
    });

    it('should reject when loanId is empty string', () => {
      component.reject('');

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Loan ID is missing'
        })
      );
    });

    it('should reject when no parameter is passed', () => {
      component.reject();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Loan ID is missing'
        })
      );
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
    it('should show not implemented message', () => {
      (component as any).processApproval(123);

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'warning',
          title: 'Not Implemented',
          text: 'Loan approval functionality needs to be implemented'
        })
      );
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
    it('should show not implemented message', () => {
      (component as any).processRejection(123, 'Test reason');

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'warning',
          title: 'Not Implemented',
          text: 'Loan rejection functionality needs to be implemented'
        })
      );
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
