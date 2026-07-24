/**
 * Unit Tests for EmployeeWithdrawalComponent
 *
 * Tests basic component initialization
 * Note: Component is currently a placeholder with no implementation
 * Target coverage: 100% (for current minimal implementation)
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { EmployeeWithdrawalComponent } from './employee.withdrawal.component';
import { ToastService } from 'src/app/service/toast.service';
import { DEMO_ACCOUNTS } from 'src/app/shared/demo-banking-fixtures';
import Swal from 'sweetalert2';

describe('EmployeeWithdrawalComponent', () => {
  let component: EmployeeWithdrawalComponent;
  let fixture: ComponentFixture<EmployeeWithdrawalComponent>;
  let toastService: ToastService;
  const knownAccount = String(DEMO_ACCOUNTS[0].account_id);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeWithdrawalComponent],
      imports: [FormsModule, CommonModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeWithdrawalComponent);
    component = fixture.componentInstance;

    toastService = TestBed.inject(ToastService);
    spyOn(toastService, 'error');
    // processDeposit/processWithdrawal chain .then() off the confirmation dialog.
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false }) as any);

    fixture.detectChanges();
  });

  describe('validation is non-blocking', () => {
    it('rejects an unknown account without opening a dialog', () => {
      component.accountNumber = 'ACC-000000';
      component.amount = 500;

      component.processWithdrawal();

      expect(toastService.error).toHaveBeenCalledWith(
        'Account not found',
        'No branch account matches that number.'
      );
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('refuses to overdraw the account', () => {
      component.accountNumber = knownAccount;
      component.amount = component.accountBalance + 1;

      component.processWithdrawal();

      expect(toastService.error).toHaveBeenCalledWith(
        'Insufficient balance',
        jasmine.stringMatching('exceeds the available balance')
      );
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('rejects a missing amount without opening a dialog', () => {
      component.accountNumber = knownAccount;
      component.amount = null;

      component.processWithdrawal();

      expect(toastService.error).toHaveBeenCalledWith(
        'Check the withdrawal details',
        'Look up a valid account and enter an amount.'
      );
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('still asks the teller to confirm before withdrawing', () => {
      component.accountNumber = knownAccount;
      component.amount = 100;

      component.processWithdrawal();

      // Money movement is irreversible, so this one stays modal.
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({ title: 'Confirm withdrawal' })
      );
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be defined', () => {
      expect(component).toBeDefined();
    });

    it('should have a constructor', () => {
      expect(component.constructor).toBeDefined();
    });
  });

  describe('Component Structure', () => {
    it('should be an instance of EmployeeWithdrawalComponent', () => {
      expect(component instanceof EmployeeWithdrawalComponent).toBe(true);
    });

    it('should have component metadata', () => {
      const metadata = (component.constructor as any).__annotations__;
      expect(metadata).toBeDefined();
    });
  });

  describe('loading state', () => {
    it('clears the loading flag in ngOnInit', () => {
      expect(component.isLoading).toBeFalse();
    });

    it('shows the skeleton while loading and the labelled table after', () => {
      component.isLoading = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-skeleton-table')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.demo-table-shell')).toBeFalsy();

      component.isLoading = false;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-skeleton-table')).toBeFalsy();
      const shell = fixture.nativeElement.querySelector('.demo-table-shell');
      expect(shell.getAttribute('aria-label')).toBe('Recent withdrawals');
    });
  });

  describe('withdrawal pagination', () => {
    beforeEach(() => {
      component.withdrawals = Array.from({ length: 12 }, (_, i) => ({
        withdrawal_id: `WDR-${i}`,
        account_id: 'ACC-1',
        amount: 100,
        withdrawal_time: '2026-01-01T10:00:00',
        status: 'Completed'
      }));
    });

    it('slices rows to the page size', () => {
      expect(component.pagedWithdrawals.length).toBe(component.withdrawalPageSize);
      expect(component.totalWithdrawalPages).toBe(3);
      expect(component.withdrawalRangeStart).toBe(1);
      expect(component.withdrawalRangeEnd).toBe(component.withdrawalPageSize);
    });

    it('clamps page navigation to the valid range', () => {
      component.setWithdrawalPage(99);
      expect(component.withdrawalPage).toBe(component.totalWithdrawalPages);

      component.setWithdrawalPage(0);
      expect(component.withdrawalPage).toBe(1);
    });

    it('reports a 0-of-0 range when there are no withdrawals', () => {
      component.withdrawals = [];
      expect(component.withdrawalRangeStart).toBe(0);
      expect(component.withdrawalRangeEnd).toBe(0);
      expect(component.totalWithdrawalPages).toBe(1);
    });
  });
});
