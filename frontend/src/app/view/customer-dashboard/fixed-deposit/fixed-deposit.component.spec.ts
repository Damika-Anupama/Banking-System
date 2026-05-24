/**
 * Unit Tests for FixedDepositComponent
 *
 * Tests FD creation, saving account loading, package selection, and validation
 * Target coverage: 90%+
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FixedDepositComponent } from './fixed-deposit.component';
import { FixedDepositService } from 'src/app/service/customer/fixed-deposit.service';
import { LoanService } from 'src/app/service/customer/loan.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('FixedDepositComponent', () => {
  let component: FixedDepositComponent;
  let fixture: ComponentFixture<FixedDepositComponent>;
  let mockFDService: jasmine.SpyObj<FixedDepositService>;
  let mockLoanService: jasmine.SpyObj<LoanService>;

  beforeEach(async () => {
    // Create spy objects
    mockFDService = jasmine.createSpyObj('FixedDepositService', ['getSavingAccountsDetails', 'createFD']);
    mockLoanService = jasmine.createSpyObj('LoanService', ['getFDs']);

    await TestBed.configureTestingModule({
      declarations: [FixedDepositComponent],
      imports: [
        FormsModule,
        CommonModule
      ],
      providers: [
        { provide: FixedDepositService, useValue: mockFDService },
        { provide: LoanService, useValue: mockLoanService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(FixedDepositComponent);
    component = fixture.componentInstance;

    // Spy on Swal
    spyOn(Swal, 'fire');

    // Mock initial data calls
    mockFDService.getSavingAccountsDetails.and.returnValue(of({ result: [] }));
    mockLoanService.getFDs.and.returnValue(of({ data: [] }));
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with correct package array', () => {
      expect(component.packageArray).toEqual([
        { index: 1, period: '6 months', interest: '13%' },
        { index: 2, period: '1 year', interest: '14%' },
        { index: 3, period: '3 years', interest: '15%' }
      ]);
    });

    it('should initialize with undefined selectedSavingAccount and selectedPackage', () => {
      expect(component.selectedSavingAccount).toBeUndefined();
      expect(component.selectedPackage).toBeUndefined();
    });

    it('should initialize with false loading states', () => {
      expect(component.isLoadingSavingAccounts).toBe(false);
      expect(component.isLoadingFDs).toBe(false);
      expect(component.isCreatingFD).toBe(false);
    });

    it('should initialize with empty errorMessage', () => {
      expect(component.errorMessage).toBe('');
    });

    it('should call loadSavingAccounts and loadFDs on ngOnInit', () => {
      spyOn(component, 'loadSavingAccounts');
      spyOn(component, 'loadFDs');

      component.ngOnInit();

      expect(component.loadSavingAccounts).toHaveBeenCalled();
      expect(component.loadFDs).toHaveBeenCalled();
    });
  });

  describe('loadSavingAccounts() - Success', () => {
    it('should load saving accounts successfully', () => {
      const mockAccounts = [
        { saving_account_id: 1, account_type: 'SAVINGS', amount: '50000' },
        { saving_account_id: 2, account_type: 'SAVINGS', amount: '100000' }
      ];

      mockFDService.getSavingAccountsDetails.and.returnValue(of({ result: mockAccounts }));

      component.loadSavingAccounts();

      expect(component.savingAccounts).toEqual(mockAccounts);
      expect(component.isLoadingSavingAccounts).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should handle null response', () => {
      mockFDService.getSavingAccountsDetails.and.returnValue(of(null));

      component.loadSavingAccounts();

      expect(component.savingAccounts).toEqual([]);
      expect(component.isLoadingSavingAccounts).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'warning',
          title: 'No Saving Accounts'
        })
      );
    });

    it('should handle undefined response', () => {
      mockFDService.getSavingAccountsDetails.and.returnValue(of(undefined));

      component.loadSavingAccounts();

      expect(component.savingAccounts).toEqual([]);
      expect(Swal.fire).toHaveBeenCalled();
    });

    it('should handle response without result property', () => {
      mockFDService.getSavingAccountsDetails.and.returnValue(of({} as any));

      component.loadSavingAccounts();

      expect(component.savingAccounts).toEqual([]);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'warning',
          title: 'No Saving Accounts'
        })
      );
    });

    it('should show info message for empty saving accounts', () => {
      mockFDService.getSavingAccountsDetails.and.returnValue(of({ result: [] }));

      component.loadSavingAccounts();

      expect(component.savingAccounts).toEqual([]);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'info',
          title: 'No Saving Accounts',
          text: 'You need to create a saving account before creating a fixed deposit.'
        })
      );
    });

    it('should handle non-array result', () => {
      mockFDService.getSavingAccountsDetails.and.returnValue(of({ result: 'not an array' as any }));

      component.loadSavingAccounts();

      expect(component.savingAccounts).toEqual([]);
    });
  });

  describe('loadSavingAccounts() - Errors', () => {
    it('should handle server error with message', () => {
      spyOn(console, 'error');
      const errorResponse = {
        error: { message: 'Database connection failed' }
      };

      mockFDService.getSavingAccountsDetails.and.returnValue(throwError(() => errorResponse));

      component.loadSavingAccounts();

      expect(component.errorMessage).toBe('Database connection failed');
      expect(component.isLoadingSavingAccounts).toBe(false);
      expect(component.savingAccounts).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error loading saving accounts:', errorResponse);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Database connection failed'
        })
      );
    });

    it('should handle error without specific message', () => {
      spyOn(console, 'error');
      mockFDService.getSavingAccountsDetails.and.returnValue(throwError(() => new Error('Network error')));

      component.loadSavingAccounts();

      expect(component.errorMessage).toBe('Network error');
      expect(component.savingAccounts).toEqual([]);
    });

    it('should handle error without error object', () => {
      spyOn(console, 'error');
      mockFDService.getSavingAccountsDetails.and.returnValue(throwError(() => ({})));

      component.loadSavingAccounts();

      expect(component.errorMessage).toBe('Failed to load saving accounts');
    });
  });

  describe('loadFDs() - Success', () => {
    it('should load FDs successfully', () => {
      const mockFDs = [
        { fd_id: 1, amount: 100000, duration: '1_YEAR' },
        { fd_id: 2, amount: 200000, duration: '3_YEARS' }
      ];

      mockLoanService.getFDs.and.returnValue(of({ data: mockFDs }));

      component.loadFDs();

      expect(component.fds).toEqual(mockFDs);
      expect(component.isLoadingFDs).toBe(false);
    });

    it('should handle null response', () => {
      mockLoanService.getFDs.and.returnValue(of(null));

      component.loadFDs();

      expect(component.fds).toEqual([]);
      expect(component.isLoadingFDs).toBe(false);
    });

    it('should handle undefined response', () => {
      mockLoanService.getFDs.and.returnValue(of(undefined));

      component.loadFDs();

      expect(component.fds).toEqual([]);
    });

    it('should handle response without data property', () => {
      mockLoanService.getFDs.and.returnValue(of({} as any));

      component.loadFDs();

      expect(component.fds).toEqual([]);
    });

    it('should handle empty FDs array', () => {
      mockLoanService.getFDs.and.returnValue(of({ data: [] }));

      component.loadFDs();

      expect(component.fds).toEqual([]);
      expect(component.isLoadingFDs).toBe(false);
    });

    it('should handle non-array data', () => {
      mockLoanService.getFDs.and.returnValue(of({ data: 'not an array' as any }));

      component.loadFDs();

      expect(component.fds).toEqual([]);
    });
  });

  describe('loadFDs() - Errors', () => {
    it('should handle error silently (no popup)', () => {
      spyOn(console, 'error');
      const errorResponse = {
        error: { message: 'Server error' }
      };

      mockLoanService.getFDs.and.returnValue(throwError(() => errorResponse));

      component.loadFDs();

      expect(component.fds).toEqual([]);
      expect(component.isLoadingFDs).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error loading FDs:', errorResponse);
      // Should NOT show Swal popup
      expect(Swal.fire).not.toHaveBeenCalled();
    });
  });

  describe('onAccountSelected()', () => {
    it('should set savingAccountId when account is selected', () => {
      component.selectedSavingAccount = {
        saving_account_id: 123,
        account_type: 'SAVINGS',
        amount: '50000'
      };

      component.onAccountSelected();

      expect(component.savingAccountId).toBe(123);
    });

    it('should set savingAccountId to null when no account selected', () => {
      component.selectedSavingAccount = undefined;

      component.onAccountSelected();

      expect(component.savingAccountId).toBeNull();
    });

    it('should set savingAccountId to null when account is null', () => {
      component.selectedSavingAccount = null as any;

      component.onAccountSelected();

      expect(component.savingAccountId).toBeNull();
    });

    it('should set savingAccountId to null when account has no saving_account_id', () => {
      component.selectedSavingAccount = {
        account_type: 'SAVINGS',
        amount: '50000'
      } as any;

      component.onAccountSelected();

      expect(component.savingAccountId).toBeNull();
    });
  });

  describe('onPackageSelected()', () => {
    it('should set duration and rpa for 6 months package', () => {
      component.selectedPackage = 1;

      component.onPackageSelected();

      expect(component.duration).toBe('6 months');
      expect(component.rpa).toBe('13%');
    });

    it('should set duration and rpa for 1 year package', () => {
      component.selectedPackage = 2;

      component.onPackageSelected();

      expect(component.duration).toBe('1 year');
      expect(component.rpa).toBe('14%');
    });

    it('should set duration and rpa for 3 years package', () => {
      component.selectedPackage = 3;

      component.onPackageSelected();

      expect(component.duration).toBe('3 years');
      expect(component.rpa).toBe('15%');
    });

    it('should set duration and rpa to null when no package selected', () => {
      component.selectedPackage = undefined;

      component.onPackageSelected();

      expect(component.duration).toBeNull();
      expect(component.rpa).toBeNull();
    });

    it('should handle invalid package index', () => {
      component.selectedPackage = 999;

      component.onPackageSelected();

      // Should not set duration/rpa for invalid package
      expect(component.duration).toBeUndefined();
      expect(component.rpa).toBeUndefined();
    });

    it('should handle string package number', () => {
      component.selectedPackage = '2' as any;

      component.onPackageSelected();

      expect(component.duration).toBe('1 year');
      expect(component.rpa).toBe('14%');
    });
  });

  describe('convertDuration()', () => {
    it('should convert 1_YEAR to 1 year', () => {
      expect(component.convertDuration('1_YEAR')).toBe('1 year');
    });

    it('should convert 3_YEARS to 3 years', () => {
      expect(component.convertDuration('3_YEARS')).toBe('3 years');
    });

    it('should convert 6_MONTH to 6 month', () => {
      expect(component.convertDuration('6_MONTH')).toBe('6 month');
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

  describe('checkForm() - Validation Errors', () => {
    it('should show error when all fields are missing', () => {
      component.selectedSavingAccount = undefined;
      component.selectedPackage = undefined;
      component.fdAmount = null;

      component.checkForm();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          text: 'Please select appropriate saving account, package and mention FD amount.',
          icon: 'error'
        })
      );
    });

    it('should show error when saving account is missing', () => {
      component.selectedSavingAccount = undefined;
      component.selectedPackage = 1;
      component.fdAmount = 50000;

      component.checkForm();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          icon: 'error'
        })
      );
    });

    it('should show error when package is missing', () => {
      component.selectedSavingAccount = { saving_account_id: 1, account_type: 'SAVINGS', amount: '100000' };
      component.selectedPackage = undefined;
      component.fdAmount = 50000;

      component.checkForm();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          icon: 'error'
        })
      );
    });

    it('should show error when FD amount is missing', () => {
      component.selectedSavingAccount = { saving_account_id: 1, account_type: 'SAVINGS', amount: '100000' };
      component.selectedPackage = 1;
      component.fdAmount = null;

      component.checkForm();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          icon: 'error'
        })
      );
    });

    it('should reject non-numeric amount', () => {
      component.selectedSavingAccount = { saving_account_id: 1, account_type: 'SAVINGS', amount: '100000' };
      component.selectedPackage = 1;
      component.fdAmount = '50abc';

      component.checkForm();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Invalid Amount',
          text: 'Please enter valid amount (numbers only).',
          icon: 'error'
        })
      );
    });

    it('should reject negative amount', () => {
      component.selectedSavingAccount = { saving_account_id: 1, account_type: 'SAVINGS', amount: '100000' };
      component.selectedPackage = 1;
      component.fdAmount = -5000;

      component.checkForm();

      // Negative number doesn't match /^[0-9]+$/ regex, so it triggers "numbers only" error first
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Invalid Amount',
          text: 'Please enter valid amount (numbers only).',
          icon: 'error'
        })
      );
    });

    it('should reject zero amount', () => {
      component.selectedSavingAccount = { saving_account_id: 1, account_type: 'SAVINGS', amount: '100000' };
      component.selectedPackage = 1;
      component.fdAmount = 0;

      component.checkForm();

      // fdAmount = 0 is falsy, so the "all fields" validation triggers first
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Validation Error',
          text: 'Please select appropriate saving account, package and mention FD amount.',
          icon: 'error'
        })
      );
    });

    it('should reject zero amount as string (lines 176-181)', () => {
      component.selectedSavingAccount = { saving_account_id: 1, account_type: 'SAVINGS', amount: '100000' };
      component.selectedPackage = 1;
      component.savingAccountId = 1;
      component.fdAmount = '0';

      component.checkForm();

      // String '0' passes regex /^[0-9]+$/ but Number('0') === 0, so amount <= 0 validation triggers
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Invalid Amount',
          text: 'Please enter a valid positive amount.',
          icon: 'error'
        })
      );
    });

    it('should accept valid positive amount as string (lines 174-182 pass)', () => {
      component.selectedSavingAccount = { saving_account_id: 1, account_type: 'SAVINGS', amount: '100000' };
      component.selectedPackage = 1;
      component.savingAccountId = 1;
      component.fdAmount = '50000';
      component.duration = '1 year';
      component.rpa = '14%';

      mockFDService.createFD.and.returnValue(of({ message: 'Success' }));

      component.checkForm();

      // String '50000' passes regex, Number('50000') = 50000 > 0, passes positive validation
      expect(mockFDService.createFD).toHaveBeenCalled();
    });

    it('should accept valid positive amount as number (lines 174-182 pass)', () => {
      component.selectedSavingAccount = { saving_account_id: 1, account_type: 'SAVINGS', amount: '100000' };
      component.selectedPackage = 1;
      component.savingAccountId = 1;
      component.fdAmount = 25000;
      component.duration = '6 months';
      component.rpa = '13%';

      mockFDService.createFD.and.returnValue(of({ message: 'Success' }));

      component.checkForm();

      // Number 25000 passes regex, Number(25000) = 25000 > 0, passes positive validation
      expect(mockFDService.createFD).toHaveBeenCalled();
    });

    it('should reject when savingAccountId is not set', () => {
      component.selectedSavingAccount = { saving_account_id: 1, account_type: 'SAVINGS', amount: '100000' };
      component.selectedPackage = 1;
      component.fdAmount = 50000;
      component.savingAccountId = null;

      component.checkForm();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Error',
          text: 'Invalid saving account selected.',
          icon: 'error'
        })
      );
    });

    it('should reject invalid duration', () => {
      component.selectedSavingAccount = { saving_account_id: 1, account_type: 'SAVINGS', amount: '100000' };
      component.selectedPackage = 1;
      component.fdAmount = 50000;
      component.savingAccountId = 1;
      component.duration = 'invalid duration';
      component.rpa = '13%';

      component.checkForm();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Invalid Duration',
          text: 'Please select a valid package.',
          icon: 'error'
        })
      );
    });

    it('should reject invalid interest rate', () => {
      component.selectedSavingAccount = { saving_account_id: 1, account_type: 'SAVINGS', amount: '100000' };
      component.selectedPackage = 1;
      component.fdAmount = 50000;
      component.savingAccountId = 1;
      component.duration = '6 months';
      component.rpa = 'invalid%';

      component.checkForm();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Invalid Interest Rate',
          text: 'Please select a valid package.',
          icon: 'error'
        })
      );
    });
  });

  describe('checkForm() - Successful FD Creation', () => {
    beforeEach(() => {
      component.selectedSavingAccount = { saving_account_id: 1, account_type: 'SAVINGS', amount: '100000' };
      component.selectedPackage = 1;
      component.savingAccountId = 1;
      mockLoanService.getFDs.and.returnValue(of({ data: [] }));
    });

    it('should create FD successfully with 6 months package', () => {
      component.fdAmount = 50000;
      component.duration = '6 months';
      component.rpa = '13%';

      mockFDService.createFD.and.returnValue(of({ message: 'FD created successfully' }));

      component.checkForm();

      expect(mockFDService.createFD).toHaveBeenCalledWith(1, '6_MONTH', '13', 50000);
      expect(component.isCreatingFD).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Success',
          icon: 'success'
        })
      );
    });

    it('should create FD with 1 year package', () => {
      component.fdAmount = 75000;
      component.duration = '1 year';
      component.rpa = '14%';

      mockFDService.createFD.and.returnValue(of({ message: 'Success' }));

      component.checkForm();

      expect(mockFDService.createFD).toHaveBeenCalledWith(1, '1_YEAR', '14', 75000);
    });

    it('should create FD with 3 years package', () => {
      component.fdAmount = 100000;
      component.duration = '3 years';
      component.rpa = '15%';

      mockFDService.createFD.and.returnValue(of({ message: 'Success' }));

      component.checkForm();

      expect(mockFDService.createFD).toHaveBeenCalledWith(1, '3_YEARS', '15', 100000);
    });

    it('should reset form after successful creation', () => {
      component.fdAmount = 50000;
      component.duration = '6 months';
      component.rpa = '13%';

      mockFDService.createFD.and.returnValue(of({ message: 'Success' }));

      component.checkForm();

      expect(component.selectedSavingAccount).toBeUndefined();
      expect(component.selectedPackage).toBeUndefined();
      expect(component.fdAmount).toBeNull();
      expect(component.savingAccountId).toBeNull();
      expect(component.duration).toBeNull();
      expect(component.rpa).toBeNull();
    });

    it('should reload FDs after successful creation', () => {
      component.fdAmount = 50000;
      component.duration = '6 months';
      component.rpa = '13%';

      mockFDService.createFD.and.returnValue(of({ message: 'Success' }));
      spyOn(component, 'loadFDs');

      component.checkForm();

      expect(component.loadFDs).toHaveBeenCalled();
    });

    it('should handle response without message', () => {
      component.fdAmount = 50000;
      component.duration = '6 months';
      component.rpa = '13%';

      mockFDService.createFD.and.returnValue(of({} as any));

      component.checkForm();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Success',
          text: 'Fixed deposit created successfully!',
          icon: 'success'
        })
      );
    });

    it('should handle string amount', () => {
      component.fdAmount = '50000';
      component.duration = '6 months';
      component.rpa = '13%';

      mockFDService.createFD.and.returnValue(of({ message: 'Success' }));

      component.checkForm();

      expect(mockFDService.createFD).toHaveBeenCalledWith(1, '6_MONTH', '13', 50000);
    });
  });

  describe('checkForm() - Error Handling', () => {
    beforeEach(() => {
      component.selectedSavingAccount = { saving_account_id: 1, account_type: 'SAVINGS', amount: '100000' };
      component.selectedPackage = 1;
      component.savingAccountId = 1;
      component.fdAmount = 50000;
      component.duration = '6 months';
      component.rpa = '13%';
    });

    it('should handle server error with message', () => {
      spyOn(console, 'error');
      const errorResponse = {
        error: { message: 'Insufficient balance' }
      };

      mockFDService.createFD.and.returnValue(throwError(() => errorResponse));

      component.checkForm();

      expect(component.errorMessage).toBe('Insufficient balance');
      expect(component.isCreatingFD).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error creating FD:', errorResponse);
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'FD Creation Failed',
          text: 'Insufficient balance'
        })
      );
    });

    it('should handle error without specific message', () => {
      spyOn(console, 'error');
      mockFDService.createFD.and.returnValue(throwError(() => new Error('Network error')));

      component.checkForm();

      expect(component.errorMessage).toBe('Network error');
    });

    it('should handle error without error object', () => {
      spyOn(console, 'error');
      mockFDService.createFD.and.returnValue(throwError(() => ({})));

      component.checkForm();

      expect(component.errorMessage).toBe('Failed to create fixed deposit');
    });

    it('should handle processing error', () => {
      spyOn(console, 'error');
      mockFDService.createFD.and.throwError('Processing error');

      component.checkForm();

      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({
          icon: 'error',
          title: 'Error',
          text: 'Failed to process fixed deposit creation'
        })
      );
    });
  });

  describe('Subscription Management', () => {
    it('should add subscriptions to subscriptions array', () => {
      mockFDService.getSavingAccountsDetails.and.returnValue(of({ result: [] }));
      mockLoanService.getFDs.and.returnValue(of({ data: [] }));

      component.loadSavingAccounts();
      component.loadFDs();

      expect((component as any).subscriptions.length).toBeGreaterThanOrEqual(2);
    });

    it('should unsubscribe all subscriptions on ngOnDestroy', () => {
      mockFDService.getSavingAccountsDetails.and.returnValue(of({ result: [] }));
      mockLoanService.getFDs.and.returnValue(of({ data: [] }));

      component.loadSavingAccounts();
      component.loadFDs();

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
