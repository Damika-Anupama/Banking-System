/**
 * Unit Tests for LoanComponent
 *
 * Tests loan application, FD selection, validation, and error handling
 * Target coverage: 90%+
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LoanComponent } from './loan.component';
import { LoanService } from 'src/app/service/customer/loan.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('LoanComponent', () => {
  let component: LoanComponent;
  let fixture: ComponentFixture<LoanComponent>;
  let mockLoanService: jasmine.SpyObj<LoanService>;

  beforeEach(async () => {
    mockLoanService = jasmine.createSpyObj('LoanService', [
      'getFDs',
      'getLoans',
      'applyLoan'
    ]);

    await TestBed.configureTestingModule({
      declarations: [LoanComponent],
      imports: [CommonModule, FormsModule],
      providers: [
        { provide: LoanService, useValue: mockLoanService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    // Spy on Swal
    spyOn(Swal, 'fire');

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      mockLoanService.getFDs.and.returnValue(of({ data: [] }));
      mockLoanService.getLoans.and.returnValue(of({ data: [] }));

      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      mockLoanService.getFDs.and.returnValue(of({ data: [] }));
      mockLoanService.getLoans.and.returnValue(of({ data: [] }));

      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;

      expect(component.selectedFDId).toBe(0);
      expect(component.maximumLoanAmount).toBe(0);
      expect(component.loanAmount).toBe(0);
      expect(component.selectedLoan).toBeUndefined();
      expect(component.selectedLoanType).toBe('');
      expect(component.isLoadingFDs).toBe(false);
      expect(component.isLoadingLoans).toBe(false);
      expect(component.isProcessingLoan).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(component.packageArray.length).toBe(3);
    });

    it('should call loadFDs and loadLoans on ngOnInit', () => {
      mockLoanService.getFDs.and.returnValue(of({ data: [] }));
      mockLoanService.getLoans.and.returnValue(of({ data: [] }));

      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;

      spyOn(component, 'loadFDs');
      spyOn(component, 'loadLoans');

      component.ngOnInit();

      expect(component.loadFDs).toHaveBeenCalled();
      expect(component.loadLoans).toHaveBeenCalled();
    });
  });

  describe('loadFDs() - Successful Loading', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
    });

    it('should load FDs successfully', () => {
      const mockFDs = {
        data: [
          { fd_id: 1, amount: '100000', duration: '1_YEAR' },
          { fd_id: 2, amount: '200000', duration: '3_YEARS' }
        ]
      };

      mockLoanService.getFDs.and.returnValue(of(mockFDs));

      component.loadFDs();

      expect(component.fds).toEqual(mockFDs.data);
      expect(component.isLoadingFDs).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should handle empty FD array', () => {
      mockLoanService.getFDs.and.returnValue(of({ data: [] }));

      component.loadFDs();

      expect(component.fds).toEqual([]);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'info',
          title: 'No Fixed Deposits',
          text: 'You need to create a fixed deposit before applying for a loan.'
        })
      );
    });

    it('should handle null response', () => {
      mockLoanService.getFDs.and.returnValue(of(null));

      component.loadFDs();

      expect(component.fds).toEqual([]);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'warning',
          title: 'No Fixed Deposits'
        })
      );
    });

    it('should handle missing data property', () => {
      mockLoanService.getFDs.and.returnValue(of({} as any));

      component.loadFDs();

      expect(component.fds).toEqual([]);
    });

    it('should handle non-array data', () => {
      mockLoanService.getFDs.and.returnValue(of({ data: {} } as any));

      component.loadFDs();

      expect(component.fds).toEqual([]);
    });
  });

  describe('loadFDs() - Error Handling', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
    });

    it('should handle server error', () => {
      spyOn(console, 'error');
      const errorResponse = {
        error: { message: 'Unauthorized access' }
      };

      mockLoanService.getFDs.and.returnValue(throwError(() => errorResponse));

      component.loadFDs();

      expect(component.errorMessage).toBe('Unauthorized access');
      expect(component.isLoadingFDs).toBe(false);
      expect(component.fds).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error loading FDs:', errorResponse);
    });

    it('should handle error without specific message', () => {
      spyOn(console, 'error');
      mockLoanService.getFDs.and.returnValue(throwError(() => new Error('Network error')));

      component.loadFDs();

      expect(component.errorMessage).toBe('Network error');
    });
  });

  describe('loadLoans() - Successful Loading', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
    });

    it('should load loans successfully', () => {
      const mockLoans = {
        data: [
          { loan_id: 1, amount: '50000', status: 'APPROVED' },
          { loan_id: 2, amount: '75000', status: 'PENDING' }
        ]
      };

      mockLoanService.getLoans.and.returnValue(of(mockLoans));

      component.loadLoans();

      expect(component.loans).toEqual(mockLoans.data);
      expect(component.isLoadingLoans).toBe(false);
    });

    it('should handle empty loans array', () => {
      mockLoanService.getLoans.and.returnValue(of({ data: [] }));

      component.loadLoans();

      expect(component.loans).toEqual([]);
    });

    it('should handle null response', () => {
      mockLoanService.getLoans.and.returnValue(of(null));

      component.loadLoans();

      expect(component.loans).toEqual([]);
    });

    it('should handle non-array data', () => {
      mockLoanService.getLoans.and.returnValue(of({ data: {} } as any));

      component.loadLoans();

      expect(component.loans).toEqual([]);
    });
  });

  describe('loadLoans() - Error Handling', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
    });

    it('should handle server error silently', () => {
      spyOn(console, 'error');
      const error = new Error('Server error');

      mockLoanService.getLoans.and.returnValue(throwError(() => error));

      component.loadLoans();

      expect(component.loans).toEqual([]);
      expect(component.isLoadingLoans).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error loading loans:', error);
      expect(Swal.fire).not.toHaveBeenCalled(); // Silent failure
    });
  });

  describe('convertDuration()', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
    });

    it('should convert underscore to space', () => {
      expect(component.convertDuration('1_YEAR')).toBe('1 year');
      expect(component.convertDuration('3_YEARS')).toBe('3 years');
      expect(component.convertDuration('6_MONTHS')).toBe('6 months');
    });

    it('should handle null duration', () => {
      expect(component.convertDuration(null)).toBe('');
    });

    it('should handle undefined duration', () => {
      expect(component.convertDuration(undefined)).toBe('');
    });

    it('should handle empty string', () => {
      expect(component.convertDuration('')).toBe('');
    });
  });

  describe('onFDSelected() - Valid Selection', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
    });

    it('should calculate maximum loan amount (< 500000)', () => {
      component.selectedFD = {
        fd_id: 1,
        amount: '500000',
        duration: '1_YEAR'
      } as any;

      component.onFDSelected();

      expect(component.maximumLoanAmount).toBe(300000); // 60% of 500000
      expect(component.selectedFDId).toBe(1);
    });

    it('should cap maximum loan amount at 500000', () => {
      component.selectedFD = {
        fd_id: 2,
        amount: '1000000',
        duration: '3_YEARS'
      } as any;

      component.onFDSelected();

      expect(component.maximumLoanAmount).toBe(500000); // Capped at 500000
      expect(component.selectedFDId).toBe(2);
    });

    it('should calculate exactly at boundary', () => {
      component.selectedFD = {
        fd_id: 3,
        amount: '833333.33',
        duration: '2_YEARS'
      } as any;

      component.onFDSelected();

      // 833333.33 * 0.6 = 499999.998 < 500000
      expect(component.maximumLoanAmount).toBeCloseTo(499999.998, 2);
    });
  });

  describe('onFDSelected() - Invalid Selection', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
    });

    it('should reject null selectedFD', () => {
      component.selectedFD = null as any;

      component.onFDSelected();

      expect(component.maximumLoanAmount).toBe(0);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Invalid Selection',
          text: 'Please select a valid fixed deposit'
        })
      );
    });

    it('should reject FD with null amount', () => {
      component.selectedFD = {
        fd_id: 1,
        amount: null as any,
        duration: '1_YEAR'
      } as any;

      component.onFDSelected();

      expect(component.maximumLoanAmount).toBe(0);
    });

    it('should reject FD with invalid amount', () => {
      component.selectedFD = {
        fd_id: 1,
        amount: 'invalid',
        duration: '1_YEAR'
      } as any;

      component.onFDSelected();

      expect(component.maximumLoanAmount).toBe(0);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Invalid Amount'
        })
      );
    });

    it('should reject FD with zero amount', () => {
      component.selectedFD = {
        fd_id: 1,
        amount: '0',
        duration: '1_YEAR'
      } as any;

      component.onFDSelected();

      expect(component.maximumLoanAmount).toBe(0);
    });

    it('should reject FD with negative amount', () => {
      component.selectedFD = {
        fd_id: 1,
        amount: '-50000',
        duration: '1_YEAR'
      } as any;

      component.onFDSelected();

      expect(component.maximumLoanAmount).toBe(0);
    });

    it('should handle calculation error', () => {
      spyOn(console, 'error');
      component.selectedFD = {
        fd_id: 1,
        amount: '100000',
        duration: '1_YEAR'
      } as any;

      // Force error by making Number() throw
      spyOn(window, 'Number').and.throwError('Calculation error');

      component.onFDSelected();

      expect(component.maximumLoanAmount).toBe(0);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('onLoanSelected()', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
    });

    it('should set duration and interest for 6 months', () => {
      component.selectedLoan = 1;

      component.onLoanSelected();

      expect(component.duration).toBe('6 months');
      expect(component.interest).toBe('13%');
    });

    it('should set duration and interest for 1 year', () => {
      component.selectedLoan = 2;

      component.onLoanSelected();

      expect(component.duration).toBe('1 year');
      expect(component.interest).toBe('14%');
    });

    it('should set duration and interest for 3 years', () => {
      component.selectedLoan = 3;

      component.onLoanSelected();

      expect(component.duration).toBe('3 years');
      expect(component.interest).toBe('15%');
    });

    it('should handle null selectedLoan', () => {
      component.selectedLoan = undefined;

      component.onLoanSelected();

      expect(component.duration).toBeNull();
      expect(component.interest).toBeNull();
    });

    it('should handle invalid loan index', () => {
      component.selectedLoan = 99;
      component.duration = 'previous';
      component.interest = 'previous';

      component.onLoanSelected();

      // Should not change values if not found
      expect(component.duration).toBe('previous');
      expect(component.interest).toBe('previous');
    });
  });

  describe('checkLoanAmount()', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
    });

    it('should reject zero amount', () => {
      component.loanAmount = 0;

      component.checkLoanAmount();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Invalid Amount',
          text: 'Please enter a valid loan amount'
        })
      );
    });

    it('should reject negative amount', () => {
      component.loanAmount = -1000;

      component.checkLoanAmount();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Invalid Amount'
        })
      );
    });

    it('should warn when exceeding maximum', () => {
      component.loanAmount = 100000;
      component.maximumLoanAmount = 50000;

      component.checkLoanAmount();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Amount Exceeds Limit'
        })
      );
    });

    it('should allow valid amount within limit', () => {
      component.loanAmount = 30000;
      component.maximumLoanAmount = 50000;

      component.checkLoanAmount();

      // Should not show error
      expect(Swal.fire).not.toHaveBeenCalled();
    });
  });

  describe('proceed() - Validation', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
      localStorage.setItem('userId', '123');
    });

    it('should reject incomplete form', () => {
      component.selectedFD = null as any;
      component.selectedLoan = undefined;
      component.loanAmount = 0;
      component.selectedLoanType = '';

      component.proceed();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please select all the fields (FD, Loan Package, Amount, Loan Type)'
        })
      );
    });

    it('should reject zero loan amount', () => {
      component.selectedFD = { fd_id: 1, amount: '100000', duration: '1_YEAR' } as any;
      component.selectedLoan = 1;
      component.loanAmount = 0;
      component.selectedLoanType = 'Personal';

      component.proceed();

      // loanAmount = 0 is falsy, so the "all fields" validation triggers first
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please select all the fields (FD, Loan Package, Amount, Loan Type)'
        })
      );
    });

    it('should reject negative loan amount', () => {
      component.selectedFD = { fd_id: 1, amount: '100000', duration: '1_YEAR' } as any;
      component.selectedLoan = 1;
      component.loanAmount = -5000; // Negative amount is truthy but invalid
      component.maximumLoanAmount = 50000;
      component.selectedLoanType = 'Personal';

      component.proceed();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Invalid Amount'
        })
      );
    });

    it('should reject amount exceeding maximum', () => {
      component.selectedFD = { fd_id: 1, amount: '100000', duration: '1_YEAR' } as any;
      component.selectedLoan = 1;
      component.loanAmount = 100000;
      component.maximumLoanAmount = 50000;
      component.selectedLoanType = 'Personal';

      component.proceed();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Amount Exceeds Limit'
        })
      );
    });

    it('should reject missing userId', () => {
      localStorage.clear();
      component.selectedFD = { fd_id: 1, amount: '100000', duration: '1_YEAR' } as any;
      component.selectedLoan = 1;
      component.loanAmount = 30000;
      component.maximumLoanAmount = 50000;
      component.selectedLoanType = 'Personal';

      component.proceed();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Authentication Error'
        })
      );
    });
  });

  describe('proceed() - Successful Application', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
      localStorage.setItem('userId', '123');
    });

    it('should apply loan successfully with Personal type', () => {
      component.selectedFD = { fd_id: 1, amount: '100000', duration: '1_YEAR' } as any;
      component.selectedLoan = 1;
      component.loanAmount = 30000;
      component.maximumLoanAmount = 60000;
      component.selectedLoanType = 'Personal';
      component.duration = '6 months';
      component.interest = '13%';

      mockLoanService.applyLoan.and.returnValue(of({ message: 'Success' }));
      mockLoanService.getLoans.and.returnValue(of({ data: [] }));

      component.proceed();

      expect(mockLoanService.applyLoan).toHaveBeenCalledWith(
        1,
        30000,
        '123',
        '180', // 6 months = 180 days
        '13', // String(13.00) = '13'
        'PERSONAL'
      );
      expect(component.isProcessingLoan).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'success',
          title: 'Success'
        })
      );
    });

    it('should apply loan with Business type', () => {
      component.selectedFD = { fd_id: 2, amount: '200000', duration: '3_YEARS' } as any;
      component.selectedLoan = 3;
      component.loanAmount = 50000;
      component.maximumLoanAmount = 120000;
      component.selectedLoanType = 'Business';
      component.duration = '3 years';
      component.interest = '15%';

      mockLoanService.applyLoan.and.returnValue(of({ message: 'Success' }));
      mockLoanService.getLoans.and.returnValue(of({ data: [] }));

      component.proceed();

      expect(mockLoanService.applyLoan).toHaveBeenCalledWith(
        2,
        50000,
        '123',
        '1080', // 3 years = 1080 days
        '15', // String(15.00) = '15'
        'BUSINESS'
      );
    });

    it('should reset form after successful application', () => {
      component.selectedFD = { fd_id: 1, amount: '100000', duration: '1_YEAR' } as any;
      component.selectedLoan = 2;
      component.loanAmount = 40000;
      component.maximumLoanAmount = 60000;
      component.selectedLoanType = 'Personal';
      component.duration = '1 year';
      component.interest = '14%';

      mockLoanService.applyLoan.and.returnValue(of({ message: 'Success' }));
      mockLoanService.getLoans.and.returnValue(of({ data: [] }));

      component.proceed();

      expect(component.selectedFD).toBeNull();
      expect(component.selectedLoan).toBeUndefined();
      expect(component.loanAmount).toBe(0);
      expect(component.selectedLoanType).toBe('');
      expect(component.maximumLoanAmount).toBe(0);
      expect(component.duration).toBeNull();
      expect(component.interest).toBeNull();
    });

    it('should reload loans after successful application', () => {
      component.selectedFD = { fd_id: 1, amount: '100000', duration: '1_YEAR' } as any;
      component.selectedLoan = 1;
      component.loanAmount = 30000;
      component.maximumLoanAmount = 60000;
      component.selectedLoanType = 'Personal';
      component.duration = '6 months';
      component.interest = '13%';

      mockLoanService.applyLoan.and.returnValue(of({ message: 'Success' }));
      mockLoanService.getLoans.and.returnValue(of({ data: [] }));

      component.proceed();

      expect(mockLoanService.getLoans).toHaveBeenCalled();
    });
  });

  describe('proceed() - Invalid Interest/Duration', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
      localStorage.setItem('userId', '123');
    });

    it('should reject invalid interest rate', () => {
      component.selectedFD = { fd_id: 1, amount: '100000', duration: '1_YEAR' } as any;
      component.selectedLoan = 1;
      component.loanAmount = 30000;
      component.maximumLoanAmount = 60000;
      component.selectedLoanType = 'Personal';
      component.duration = '6 months';
      component.interest = 'invalid%';

      component.proceed();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Invalid Interest'
        })
      );
    });

    it('should reject invalid duration', () => {
      component.selectedFD = { fd_id: 1, amount: '100000', duration: '1_YEAR' } as any;
      component.selectedLoan = 1;
      component.loanAmount = 30000;
      component.maximumLoanAmount = 60000;
      component.selectedLoanType = 'Personal';
      component.duration = 'invalid duration';
      component.interest = '13%';

      component.proceed();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Invalid Duration'
        })
      );
    });
  });

  describe('proceed() - Error Handling', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
      localStorage.setItem('userId', '123');
    });

    it('should handle server error', () => {
      spyOn(console, 'error');
      component.selectedFD = { fd_id: 1, amount: '100000', duration: '1_YEAR' } as any;
      component.selectedLoan = 1;
      component.loanAmount = 30000;
      component.maximumLoanAmount = 60000;
      component.selectedLoanType = 'Personal';
      component.duration = '6 months';
      component.interest = '13%';

      const errorResponse = {
        error: { message: 'Insufficient FD balance' }
      };

      mockLoanService.applyLoan.and.returnValue(throwError(() => errorResponse));

      component.proceed();

      expect(component.errorMessage).toBe('Insufficient FD balance');
      expect(component.isProcessingLoan).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error applying loan:', errorResponse);
    });

    it('should handle processing error', () => {
      spyOn(console, 'error');
      component.selectedFD = { fd_id: 1, amount: '100000', duration: '1_YEAR' } as any;
      component.selectedLoan = 1;
      component.loanAmount = 30000;
      component.maximumLoanAmount = 60000;
      component.selectedLoanType = 'Personal';
      component.duration = '6 months';
      component.interest = '13%';

      mockLoanService.applyLoan.and.throwError('Processing error');

      component.proceed();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Failed to process loan application'
        })
      );
    });
  });

  describe('Subscription Management', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
    });

    it('should unsubscribe all subscriptions on ngOnDestroy', () => {
      mockLoanService.getFDs.and.returnValue(of({ data: [] }));
      mockLoanService.getLoans.and.returnValue(of({ data: [] }));

      component.loadFDs();
      component.loadLoans();

      const subscription1 = (component as any).subscriptions[0];
      const subscription2 = (component as any).subscriptions[1];
      spyOn(subscription1, 'unsubscribe');
      spyOn(subscription2, 'unsubscribe');

      component.ngOnDestroy();

      expect(subscription1.unsubscribe).toHaveBeenCalled();
      expect(subscription2.unsubscribe).toHaveBeenCalled();
    });
  });
});
