import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import Swal from 'sweetalert2';

import { EmployeeDepositComponent } from './employee.deposit.component';
import { ToastService } from 'src/app/service/toast.service';
import { DEMO_ACCOUNTS } from 'src/app/shared/demo-banking-fixtures';

describe('EmployeeDepositComponent', () => {
  let component: EmployeeDepositComponent;
  let fixture: ComponentFixture<EmployeeDepositComponent>;
  let toastService: ToastService;

  const knownAccount = String(DEMO_ACCOUNTS[0].account_id);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeDepositComponent],
      imports: [CommonModule, FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeDepositComponent);
    component = fixture.componentInstance;

    toastService = TestBed.inject(ToastService);
    spyOn(toastService, 'error');
    spyOn(toastService, 'info');
    // processDeposit/processWithdrawal chain .then() off the confirmation dialog.
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false }) as any);
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  describe('account lookup', () => {
    it('matches a known account regardless of case or padding', () => {
      component.accountNumber = `  ${knownAccount.toLowerCase()} `;
      expect(component.matchedAccount).not.toBeNull();
      expect(component.accountNotFound).toBe(false);
    });

    it('does not report "not found" for an empty field', () => {
      component.accountNumber = '';
      expect(component.accountNotFound).toBe(false);
    });

    it('reports an unknown account number as not found', () => {
      component.accountNumber = 'ACC-000000';
      expect(component.accountNotFound).toBe(true);
    });
  });

  describe('validation is non-blocking', () => {
    it('rejects an unknown account without opening a dialog', () => {
      component.accountNumber = 'ACC-000000';
      component.amount = 500;

      component.processDeposit();

      expect(toastService.error).toHaveBeenCalledWith(
        'Account not found',
        'No branch account matches that number.'
      );
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('requires a cheque reference for a cheque deposit', () => {
      component.accountNumber = knownAccount;
      component.amount = 500;
      component.method = 'Cheque';
      component.reference = '';

      component.processDeposit();

      expect(toastService.info).toHaveBeenCalledWith(
        'Cheque reference required',
        'Enter the cheque number for a cheque deposit.'
      );
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('accepts a cheque deposit once a reference is supplied', () => {
      component.accountNumber = knownAccount;
      component.amount = 500;
      component.method = 'Cheque';
      component.reference = 'CHQ-9001';

      expect(component.chequeNeedsReference).toBe(false);
      expect(component.isValid).toBe(true);
    });

    it('rejects a missing amount without opening a dialog', () => {
      component.accountNumber = knownAccount;
      component.amount = null;

      component.processDeposit();

      expect(toastService.error).toHaveBeenCalledWith(
        'Check the deposit details',
        'Look up a valid account and enter an amount.'
      );
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('rejects a non-positive amount', () => {
      component.accountNumber = knownAccount;
      component.amount = 0;

      expect(component.isValid).toBe(false);
    });
  });

  describe('loading state', () => {
    it('clears the loading flag in ngOnInit', () => {
      fixture.detectChanges();
      expect(component.isLoading).toBeFalse();
    });

    it('shows the skeleton while loading and the labelled table after', () => {
      fixture.detectChanges();

      component.isLoading = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-skeleton-table')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.demo-table-shell')).toBeFalsy();

      component.isLoading = false;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-skeleton-table')).toBeFalsy();
      const shell = fixture.nativeElement.querySelector('.demo-table-shell');
      expect(shell.getAttribute('aria-label')).toBe('Recent deposits');
    });
  });

  describe('deposit pagination', () => {
    beforeEach(() => {
      component.deposits = Array.from({ length: 12 }, (_, i) => ({
        deposit_id: `DEP-${i}`,
        account_id: 'ACC-1',
        amount: 100,
        method: 'Cash',
        deposit_time: '2026-01-01T10:00:00',
        status: 'Completed'
      }));
    });

    it('slices rows to the page size', () => {
      expect(component.pagedDeposits.length).toBe(component.depositPageSize);
      expect(component.totalDepositPages).toBe(3);
      expect(component.depositRangeStart).toBe(1);
      expect(component.depositRangeEnd).toBe(component.depositPageSize);
    });

    it('clamps page navigation to the valid range', () => {
      component.setDepositPage(99);
      expect(component.depositPage).toBe(component.totalDepositPages);

      component.setDepositPage(0);
      expect(component.depositPage).toBe(1);
    });

    it('reports a 0-of-0 range when there are no deposits', () => {
      component.deposits = [];
      expect(component.depositRangeStart).toBe(0);
      expect(component.depositRangeEnd).toBe(0);
      expect(component.totalDepositPages).toBe(1);
    });
  });

  describe('confirmation', () => {
    it('still asks the teller to confirm before recording a deposit', () => {
      component.accountNumber = knownAccount;
      component.amount = 500;
      component.method = 'Cash';

      component.processDeposit();

      // Money movement is irreversible, so this one stays modal.
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({ title: 'Confirm deposit' })
      );
    });
  });
});
