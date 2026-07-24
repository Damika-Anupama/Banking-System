/**
 * Unit Tests for LoanComponent
 *
 * Tests loan application, FD selection, validation, and error handling
 * Target coverage: 90%+
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LoanComponent } from './loan.component';
import { LoanService } from 'src/app/service/customer/loan.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';

describe('LoanComponent', () => {
  let toastService: ToastService;
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

    toastService = TestBed.inject(ToastService);
    spyOn(toastService, 'success');
    spyOn(toastService, 'error');
    spyOn(toastService, 'warning');
    spyOn(toastService, 'info');

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
      // The page already renders the no-FD state inline; a popup repeating it is noise.
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should handle null response', () => {
      mockLoanService.getFDs.and.returnValue(of(null));

      component.loadFDs();

      expect(component.fds).toEqual([]);
      // The page already renders the no-FD state inline; a popup repeating it is noise.
      expect(Swal.fire).not.toHaveBeenCalled();
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
      expect(toastService.error).toHaveBeenCalledWith('Invalid selection', 'Please select a valid fixed deposit.');
      expect(Swal.fire).not.toHaveBeenCalled();
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
      expect(toastService.error).toHaveBeenCalledWith(
        'Invalid amount',
        'Selected fixed deposit has an invalid amount.'
      );
      expect(Swal.fire).not.toHaveBeenCalled();
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

      // Leaving the field reveals the inline error rather than popping a dialog.
      expect(component.errorFor('loanAmount')).toBe('Enter a loan amount.');
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should reject negative amount', () => {
      component.loanAmount = -1000;

      component.checkLoanAmount();

      expect(component.errorFor('loanAmount')).toBe('Enter a valid positive loan amount.');
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should warn when exceeding maximum', () => {
      component.loanAmount = 100000;
      component.maximumLoanAmount = 50000;

      component.checkLoanAmount();

      expect(component.errorFor('loanAmount')).toContain('cannot exceed');
      expect(Swal.fire).not.toHaveBeenCalled();
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

      expect(component.hasFieldErrors).toBe(true);
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should reject zero loan amount', () => {
      component.selectedFD = { fd_id: 1, amount: '100000', duration: '1_YEAR' } as any;
      component.selectedLoan = 1;
      component.loanAmount = 0;
      component.selectedLoanType = 'Personal';

      component.proceed();

      // loanAmount = 0 is falsy, so the "all fields" validation triggers first
      expect(component.hasFieldErrors).toBe(true);
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should reject negative loan amount', () => {
      component.selectedFD = { fd_id: 1, amount: '100000', duration: '1_YEAR' } as any;
      component.selectedLoan = 1;
      component.loanAmount = -5000; // Negative amount is truthy but invalid
      component.maximumLoanAmount = 50000;
      component.selectedLoanType = 'Personal';

      component.proceed();

      expect(component.errorFor('loanAmount')).toBe('Enter a valid positive loan amount.');
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should reject amount exceeding maximum', () => {
      component.selectedFD = { fd_id: 1, amount: '100000', duration: '1_YEAR' } as any;
      component.selectedLoan = 1;
      component.loanAmount = 100000;
      component.maximumLoanAmount = 50000;
      component.selectedLoanType = 'Personal';

      component.proceed();

      expect(component.errorFor('loanAmount')).toContain('cannot exceed');
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('should reject missing userId', () => {
      localStorage.clear();
      component.selectedFD = { fd_id: 1, amount: '100000', duration: '1_YEAR' } as any;
      component.selectedLoan = 1;
      component.loanAmount = 30000;
      component.maximumLoanAmount = 50000;
      component.selectedLoanType = 'Personal';
      component.acceptedLienConsent = true; // pass the collateral-consent gate

      component.proceed();

      expect(toastService.error).toHaveBeenCalledWith(
        'Session expired',
        'User ID not found. Please log in again.'
      );
      expect(Swal.fire).not.toHaveBeenCalled();
    });
  });

  describe('proceed() - Successful Application', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
      localStorage.setItem('userId', '123');
      // proceed() now requires lien consent and awaits a confirmation dialog.
      component.acceptedLienConsent = true;
      (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ isConfirmed: true }) as any);
    });

    it('should apply loan successfully with Personal type', fakeAsync(() => {
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
      tick();

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
          title: 'Loan application submitted'
        })
      );
    }));

    it('should apply loan with Business type', fakeAsync(() => {
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
      tick();

      expect(mockLoanService.applyLoan).toHaveBeenCalledWith(
        2,
        50000,
        '123',
        '1080', // 3 years = 1080 days
        '15', // String(15.00) = '15'
        'BUSINESS'
      );
    }));

    it('should reset form after successful application', fakeAsync(() => {
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
      tick();

      expect(component.selectedFD).toBeNull();
      expect(component.selectedLoan).toBeUndefined();
      expect(component.loanAmount).toBe(0);
      expect(component.selectedLoanType).toBe('');
      expect(component.maximumLoanAmount).toBe(0);
      expect(component.duration).toBeNull();
      expect(component.interest).toBeNull();
    }));

    it('should reload loans after successful application', fakeAsync(() => {
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
      tick();

      expect(mockLoanService.getLoans).toHaveBeenCalled();
    }));
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
      component.acceptedLienConsent = true;

      component.proceed();

      expect(toastService.error).toHaveBeenCalledWith(
        'Invalid package',
        'Please select a valid loan package.'
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
      component.acceptedLienConsent = true;

      component.proceed();

      expect(toastService.error).toHaveBeenCalledWith(
        'Invalid package',
        'Please select a valid loan package.'
      );
    });
  });

  describe('proceed() - Error Handling', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
      localStorage.setItem('userId', '123');
      component.acceptedLienConsent = true;
      (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ isConfirmed: true }) as any);
    });

    it('should handle server error', fakeAsync(() => {
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
      tick();

      expect(component.errorMessage).toBe('Insufficient FD balance');
      expect(component.isProcessingLoan).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error applying loan:', errorResponse);
    }));

    it('should handle processing error', fakeAsync(() => {
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
      tick();

      // The form is valid here, so the review confirmation legitimately opens;
      // it is the *failure* that must not be another dialog.
      expect(toastService.error).toHaveBeenCalledWith(
        'Loan application failed',
        'Failed to process loan application.'
      );
    }));
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

  describe('resetApplicationForm()', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
    });

    it('clears the lien consent so the next application is not pre-consented', () => {
      component.acceptedLienConsent = true;
      component.resetApplicationForm();
      expect(component.acceptedLienConsent).toBeFalse();
    });

    it('clears touched state so prior error marks do not flash on a fresh form', () => {
      component.touched = { loanAmount: true, acceptedLienConsent: true };
      component.resetApplicationForm();
      expect(component.touched).toEqual({});
    });

    it('clears the amount and selections', () => {
      component.loanAmount = 50000;
      component.selectedLoanType = 'Personal';
      component.resetApplicationForm();
      expect(component.loanAmount).toBe(0);
      expect(component.selectedLoanType).toBe('');
      expect(component.selectedFD).toBeNull();
    });
  });

  describe('Loan pagination', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(LoanComponent);
      component = fixture.componentInstance;
    });

    it('pages loans two at a time', () => {
      component.loans = [{ amount: 1 }, { amount: 2 }, { amount: 3 }];

      expect(component.activeLoanCount).toBe(3);
      expect(component.totalLoanPages).toBe(2);
      expect(component.pagedLoans.length).toBe(2);

      component.setLoanPage(2);

      expect(component.pagedLoans.length).toBe(1);
      expect(component.loanRangeStart).toBe(3);
      expect(component.loanRangeEnd).toBe(3);
    });

    it('clamps out-of-range pages', () => {
      component.loans = [{ amount: 1 }];

      component.setLoanPage(99);
      expect(component.loanPage).toBe(1);

      component.setLoanPage(0);
      expect(component.loanPage).toBe(1);
    });

    it('reports an empty range when there are no loans', () => {
      component.loans = [];

      expect(component.activeLoanCount).toBe(0);
      expect(component.totalLoanPages).toBe(1);
      expect(component.loanRangeStart).toBe(0);
      expect(component.loanRangeEnd).toBe(0);
      expect(component.pagedLoans).toEqual([]);
    });
  });
});
