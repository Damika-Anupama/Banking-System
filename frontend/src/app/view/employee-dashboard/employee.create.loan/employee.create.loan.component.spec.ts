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
import { EmployeeCreateLoanComponent } from './employee.create.loan.component';

describe('EmployeeCreateLoanComponent', () => {
  let component: EmployeeCreateLoanComponent;
  let fixture: ComponentFixture<EmployeeCreateLoanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeCreateLoanComponent],
      imports: [FormsModule, CommonModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeCreateLoanComponent);
    component = fixture.componentInstance;
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

    it('should initialize with zero maximumLoanAmount', () => {
      expect(component.maximumLoanAmount).toBe(0);
    });

    it('should initialize with zero loanAmount', () => {
      expect(component.loanAmount).toBe(0);
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

    it('should initialize with empty selectedLoanType', () => {
      expect(component.selectedLoanType).toBe('');
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

    it('should not set duration/interest for invalid index', () => {
      component.selectedLoan = 999;
      component.duration = undefined;
      component.interest = undefined;

      component.onLoanSelected();

      expect(component.duration).toBeUndefined();
      expect(component.interest).toBeUndefined();
    });

    it('should not set duration/interest for index 0', () => {
      component.selectedLoan = 0;
      component.duration = undefined;
      component.interest = undefined;

      component.onLoanSelected();

      expect(component.duration).toBeUndefined();
      expect(component.interest).toBeUndefined();
    });

    it('should not set duration/interest for negative index', () => {
      component.selectedLoan = -1;
      component.duration = undefined;
      component.interest = undefined;

      component.onLoanSelected();

      expect(component.duration).toBeUndefined();
      expect(component.interest).toBeUndefined();
    });

    it('should handle undefined selectedLoan gracefully', () => {
      component.selectedLoan = undefined;
      component.duration = 'previous';
      component.interest = 'previous';

      component.onLoanSelected();

      // Values should remain unchanged
      expect(component.duration).toBe('previous');
      expect(component.interest).toBe('previous');
    });

    it('should handle null selectedLoan gracefully', () => {
      component.selectedLoan = null as any;
      component.duration = 'previous';
      component.interest = 'previous';

      component.onLoanSelected();

      // Values should remain unchanged
      expect(component.duration).toBe('previous');
      expect(component.interest).toBe('previous');
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
  });

  describe('Data Binding Properties', () => {
    it('should allow setting customerID', () => {
      component.customerID = 'CUST001';
      expect(component.customerID).toBe('CUST001');
    });

    it('should allow setting maximumLoanAmount', () => {
      component.maximumLoanAmount = 500000;
      expect(component.maximumLoanAmount).toBe(500000);
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

      // Number(1.9) equals 1.9, which won't match index 1 exactly
      // but the comparison uses === so it won't match
      expect(component.duration).toBeUndefined();
    });

    it('should handle very large index values', () => {
      component.selectedLoan = 999999;
      component.duration = undefined;
      component.interest = undefined;

      component.onLoanSelected();

      expect(component.duration).toBeUndefined();
      expect(component.interest).toBeUndefined();
    });

    it('should handle customerID with special characters', () => {
      component.customerID = 'CUST-001@#$';
      expect(component.customerID).toBe('CUST-001@#$');
    });

    it('should handle negative maximumLoanAmount', () => {
      component.maximumLoanAmount = -100000;
      expect(component.maximumLoanAmount).toBe(-100000);
    });

    it('should handle negative loanAmount', () => {
      component.loanAmount = -50000;
      expect(component.loanAmount).toBe(-50000);
    });
  });
});
