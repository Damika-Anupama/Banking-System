/**
 * Unit Tests for EmployeeCreateLoanComponent
 *
 * Tests loan package selection and data initialization
 * Target coverage: 90%+
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import Swal from 'sweetalert2';
import { EmployeeCreateLoanComponent } from './employee.create.loan.component';
import { ToastService } from 'src/app/service/toast.service';

describe('EmployeeCreateLoanComponent', () => {
  let component: EmployeeCreateLoanComponent;
  let fixture: ComponentFixture<EmployeeCreateLoanComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeCreateLoanComponent],
      imports: [FormsModule, CommonModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeCreateLoanComponent);
    component = fixture.componentInstance;

    toastService = TestBed.inject(ToastService);
    spyOn(toastService, 'error');

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty customerID', () => {
      expect(component.customerID).toBe('');
    });

    it('should initialize with null loanAmount', () => {
      expect(component.loanAmount).toBeNull();
    });

    it('should initialize with undefined selectedLoan', () => {
      expect(component.selectedLoan).toBeUndefined();
    });

    it('should initialize with correct package array', () => {
      expect(component.packageArray).toEqual([
        { index: 1, period: '6 months', interest: '13%' },
        { index: 2, period: '1 year', interest: '14%' },
        { index: 3, period: '3 years', interest: '15%' }
      ]);
    });

    it('should initialize with default selectedLoanType of Personal', () => {
      expect(component.selectedLoanType).toBe('Personal');
    });

    it('should have packageArray with 3 elements', () => {
      expect(component.packageArray.length).toBe(3);
    });
  });

  describe('Loan Package Selection', () => {
    it('should set duration and interest for 6 months package (index 1)', () => {
      component.selectedLoan = 1;

      component.onLoanSelected();

      expect(component.duration).toBe('6 months');
      expect(component.interest).toBe('13%');
    });

    it('should set duration and interest for 1 year package (index 2)', () => {
      component.selectedLoan = 2;

      component.onLoanSelected();

      expect(component.duration).toBe('1 year');
      expect(component.interest).toBe('14%');
    });

    it('should set duration and interest for 3 years package (index 3)', () => {
      component.selectedLoan = 3;

      component.onLoanSelected();

      expect(component.duration).toBe('3 years');
      expect(component.interest).toBe('15%');
    });

    it('should handle string selectedLoan by converting to Number', () => {
      component.selectedLoan = '2' as any;

      component.onLoanSelected();

      expect(component.duration).toBe('1 year');
      expect(component.interest).toBe('14%');
    });

    it('should reset duration/interest to null for invalid index', () => {
      component.selectedLoan = 999;
      component.duration = '6 months';
      component.interest = '13%';

      component.onLoanSelected();

      expect(component.duration).toBeNull();
      expect(component.interest).toBeNull();
    });

    it('should reset duration/interest to null for index 0', () => {
      component.selectedLoan = 0;
      component.duration = '6 months';
      component.interest = '13%';

      component.onLoanSelected();

      expect(component.duration).toBeNull();
      expect(component.interest).toBeNull();
    });

    it('should reset duration/interest to null for negative index', () => {
      component.selectedLoan = -1;
      component.duration = '6 months';
      component.interest = '13%';

      component.onLoanSelected();

      expect(component.duration).toBeNull();
      expect(component.interest).toBeNull();
    });

    it('should clear duration/interest when selectedLoan is undefined', () => {
      component.selectedLoan = undefined;
      component.duration = 'previous';
      component.interest = 'previous';

      component.onLoanSelected();

      // Stale values are cleared so the UI never shows a mismatched plan
      expect(component.duration).toBeNull();
      expect(component.interest).toBeNull();
    });

    it('should clear duration/interest when selectedLoan is null', () => {
      component.selectedLoan = null as any;
      component.duration = 'previous';
      component.interest = 'previous';

      component.onLoanSelected();

      expect(component.duration).toBeNull();
      expect(component.interest).toBeNull();
    });
  });

  describe('Package Array Structure', () => {
    it('should have correct index values', () => {
      expect(component.packageArray[0].index).toBe(1);
      expect(component.packageArray[1].index).toBe(2);
      expect(component.packageArray[2].index).toBe(3);
    });

    it('should have correct period values', () => {
      expect(component.packageArray[0].period).toBe('6 months');
      expect(component.packageArray[1].period).toBe('1 year');
      expect(component.packageArray[2].period).toBe('3 years');
    });

    it('should have correct interest values', () => {
      expect(component.packageArray[0].interest).toBe('13%');
      expect(component.packageArray[1].interest).toBe('14%');
      expect(component.packageArray[2].interest).toBe('15%');
    });

    it('should not be empty', () => {
      expect(component.packageArray.length).toBeGreaterThan(0);
    });

    it('should have consistent structure', () => {
      component.packageArray.forEach(pkg => {
        expect(pkg.index).toBeDefined();
        expect(pkg.period).toBeDefined();
        expect(pkg.interest).toBeDefined();
        expect(typeof pkg.index).toBe('number');
        expect(typeof pkg.period).toBe('string');
        expect(typeof pkg.interest).toBe('string');
      });
    });
  });

  describe('Proceed Method', () => {
    it('should exist', () => {
      expect(component.proceed).toBeDefined();
      expect(typeof component.proceed).toBe('function');
    });

    it('should execute without errors', () => {
      expect(() => component.proceed()).not.toThrow();
    });

    it('rejects an incomplete application without opening a dialog', async () => {
      const swalSpy = spyOn(Swal, 'fire');

      await component.proceed();

      expect(toastService.error).toHaveBeenCalledWith(
        'Check the highlighted fields',
        jasmine.any(String)
      );
      expect(swalSpy).not.toHaveBeenCalled();
    });
  });

  describe('inline field validation', () => {
    it('reports every problem at once rather than one error at a time', async () => {
      await component.proceed();

      expect(component.errorFor('customerID')).toBe('Select a customer.');
      expect(component.errorFor('loanAmount')).toBe('Enter a loan amount above zero.');
      expect(component.errorFor('selectedPackage')).toBe('Select a payment plan.');
    });

    it('hides an error until the user has left the field', () => {
      // Untouched: the form must not nag before the user has engaged with it.
      expect(component.errorFor('customerID')).toBeNull();
      expect(component.fieldErrors['customerID']).toBe('Select a customer.');

      component.markTouched('customerID');
      expect(component.errorFor('customerID')).toBe('Select a customer.');
    });

    it('clears the error once the field is corrected', () => {
      component.markTouched('loanAmount');
      component.loanAmount = -5;
      expect(component.errorFor('loanAmount')).toBe('Enter a loan amount above zero.');

      component.loanAmount = 250000;
      expect(component.errorFor('loanAmount')).toBeNull();
    });

    it('points a touched, invalid field at its error message', () => {
      component.markTouched('customerID');
      fixture.detectChanges();

      const select: HTMLSelectElement = fixture.nativeElement.querySelector('[name="customerID"]');
      expect(select.getAttribute('aria-invalid')).toBe('true');

      const describedBy = select.getAttribute('aria-describedby');
      expect(describedBy).toBe('customerID-error');

      const message = fixture.nativeElement.querySelector(`#${describedBy}`);
      expect(message).not.toBeNull();
      expect(message.getAttribute('role')).toBe('alert');
    });
  });

  describe('form submission wiring', () => {
    it('submits through ngSubmit rather than a click handler', () => {
      const proceedSpy = spyOn(component, 'proceed');

      const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));

      expect(proceedSpy).toHaveBeenCalled();
    });

    it('marks the primary button as the form submitter', () => {
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('form button.glass-button');
      expect(button.getAttribute('type')).toBe('submit');
    });
  });

  describe('Data Binding Properties', () => {
    it('should allow setting customerID', () => {
      component.customerID = 'CUST001';
      expect(component.customerID).toBe('CUST001');
    });

    it('should allow setting loanAmount', () => {
      component.loanAmount = 250000;
      expect(component.loanAmount).toBe(250000);
    });

    it('should allow setting selectedLoanType', () => {
      component.selectedLoanType = 'PERSONAL';
      expect(component.selectedLoanType).toBe('PERSONAL');
    });
  });

  describe('Multiple Selection Changes', () => {
    it('should handle changing selection from one package to another', () => {
      component.selectedLoan = 1;
      component.onLoanSelected();
      expect(component.duration).toBe('6 months');
      expect(component.interest).toBe('13%');

      component.selectedLoan = 2;
      component.onLoanSelected();
      expect(component.duration).toBe('1 year');
      expect(component.interest).toBe('14%');

      component.selectedLoan = 3;
      component.onLoanSelected();
      expect(component.duration).toBe('3 years');
      expect(component.interest).toBe('15%');
    });

    it('should handle rapid selection changes', () => {
      for (let i = 1; i <= 3; i++) {
        component.selectedLoan = i;
        component.onLoanSelected();
      }

      // Final values should be from last selection (index 3)
      expect(component.duration).toBe('3 years');
      expect(component.interest).toBe('15%');
    });
  });

  describe('Edge Cases', () => {
    it('should handle decimal selectedLoan by converting to Number', () => {
      component.selectedLoan = 1.9;

      component.onLoanSelected();

      // Number(1.9) === 1.9 won't match any integer index, so the plan resets
      expect(component.duration).toBeNull();
      expect(component.interest).toBeNull();
    });

    it('should handle very large index values', () => {
      component.selectedLoan = 999999;
      component.duration = '6 months';
      component.interest = '13%';

      component.onLoanSelected();

      expect(component.duration).toBeNull();
      expect(component.interest).toBeNull();
    });

    it('should handle customerID with special characters', () => {
      component.customerID = 'CUST-001@#$';
      expect(component.customerID).toBe('CUST-001@#$');
    });

    it('should handle negative loanAmount', () => {
      component.loanAmount = -50000;
      expect(component.loanAmount).toBe(-50000);
    });
  });
});
