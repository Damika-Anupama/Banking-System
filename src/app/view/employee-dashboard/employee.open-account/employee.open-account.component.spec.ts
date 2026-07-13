import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import Swal from 'sweetalert2';

import { EmployeeOpenAccountComponent } from './employee.open-account.component';
import { ToastService } from 'src/app/service/toast.service';

describe('EmployeeOpenAccountComponent', () => {
  let component: EmployeeOpenAccountComponent;
  let fixture: ComponentFixture<EmployeeOpenAccountComponent>;
  let toastService: ToastService;

  /** A customer id that actually exists in the demo store. */
  const knownCustomerId = (): string => String(component.customers[0].user_id);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeOpenAccountComponent],
      imports: [CommonModule, FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeOpenAccountComponent);
    component = fixture.componentInstance;

    toastService = TestBed.inject(ToastService);
    spyOn(toastService, 'info');
    spyOn(toastService, 'error');

    // openAccount() chains .then() off the confirmation dialog.
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false }) as any);
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  describe('minimum deposit rules', () => {
    it('requires a higher opening balance for a fixed deposit than for savings', () => {
      component.product = 'Savings';
      const savings = component.minimumDeposit;

      component.product = 'Fixed Deposit';
      expect(component.minimumDeposit).toBeGreaterThan(savings);
    });

    it('does not flag an empty balance as below the minimum', () => {
      component.openingBalance = null;
      expect(component.belowMinimum).toBe(false);
    });

    it('flags a balance under the product minimum', () => {
      component.product = 'Current';
      component.openingBalance = component.minimums['Current'] - 1;

      expect(component.belowMinimum).toBe(true);
      expect(component.isValid).toBe(false);
    });

    it('accepts a balance exactly at the minimum', () => {
      component.customerId = knownCustomerId();
      component.product = 'Current';
      component.openingBalance = component.minimums['Current'];

      expect(component.belowMinimum).toBe(false);
      expect(component.isValid).toBe(true);
    });
  });

  describe('validation is non-blocking', () => {
    it('asks for a customer without opening a dialog', () => {
      component.customerId = '';
      component.openingBalance = 5000;

      component.openAccount();

      expect(toastService.info).toHaveBeenCalledWith(
        'Select a customer',
        'Choose the customer this account is for.'
      );
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('rejects a below-minimum deposit without opening a dialog', () => {
      component.customerId = knownCustomerId();
      component.product = 'Fixed Deposit';
      component.openingBalance = 100;

      component.openAccount();

      expect(toastService.error).toHaveBeenCalledWith(
        'Below minimum',
        jasmine.stringMatching('require at least')
      );
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('rejects a missing opening balance without opening a dialog', () => {
      component.customerId = knownCustomerId();
      component.openingBalance = null;

      component.openAccount();

      expect(toastService.error).toHaveBeenCalledWith(
        'Check the account details',
        'Complete all fields to open the account.'
      );
      expect(Swal.fire).not.toHaveBeenCalled();
    });
  });

  describe('confirmation', () => {
    it('still asks the teller to confirm before opening an account', () => {
      component.customerId = knownCustomerId();
      component.product = 'Savings';
      component.openingBalance = 50000;

      component.openAccount();

      // Opening an account is not something to do by accident, so this stays modal.
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({ title: 'Confirm new account' })
      );
    });
  });
});
