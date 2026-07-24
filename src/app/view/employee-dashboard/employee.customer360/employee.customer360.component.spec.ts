import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { EmployeeCustomer360Component } from './employee.customer360.component';
import { demoStore } from 'src/app/shared/demo-store';

describe('EmployeeCustomer360Component', () => {
  let component: EmployeeCustomer360Component;
  let fixture: ComponentFixture<EmployeeCustomer360Component>;

  // The page reads from the shared demo store; reset it so each test starts
  // from the same fresh seed instead of inheriting a prior test's writes.
  beforeEach(() => demoStore.reset());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeCustomer360Component],
      imports: [CommonModule, FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeCustomer360Component);
    component = fixture.componentInstance;
  });

  it('creates with the first customer pre-selected', () => {
    expect(component).toBeTruthy();
    expect(component.selected).toBe(component.customers[0]);
  });

  describe('loading state', () => {
    it('clears the loading flag in ngOnInit', () => {
      fixture.detectChanges();
      expect(component.isLoading).toBeFalse();
    });

    it('shows the skeleton while loading and the labelled activity table after', () => {
      fixture.detectChanges();

      component.isLoading = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-skeleton-table')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.demo-table-shell')).toBeFalsy();

      component.isLoading = false;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-skeleton-table')).toBeFalsy();
      const shell = fixture.nativeElement.querySelector('.demo-table-shell');
      expect(shell.getAttribute('aria-label')).toBe('Recent customer activity');
    });
  });

  describe('customer search', () => {
    it('returns the full directory for an empty search', () => {
      component.searchTerm = '   ';
      expect(component.filteredCustomers.length).toBe(component.customers.length);
    });

    it('filters by name, id, or email', () => {
      const target = component.customers[0];
      component.searchTerm = String(target.user_id);
      expect(component.filteredCustomers.some(c => c.user_id === target.user_id)).toBeTrue();
    });
  });

  describe('selection', () => {
    it('switches the selected customer and restarts activity pagination', () => {
      component.activityPage = 3;
      const other = component.customers[1];

      component.select(other);

      expect(component.selected).toBe(other);
      expect(component.activityPage).toBe(1);
    });
  });

  describe('initials()', () => {
    it('builds two-letter uppercase initials', () => {
      expect(component.initials('Nuwan Silva')).toBe('NS');
    });

    it('handles empty names', () => {
      expect(component.initials('')).toBe('');
    });
  });

  describe('relationship math', () => {
    it('totals the balances of the customer accounts', () => {
      const expected = component
        .accounts(component.selected)
        .reduce((sum, a) => sum + Number(a.balance || 0), 0);
      expect(component.totalBalance(component.selected)).toBe(expected);
    });

    it('returns zero and no accounts for a null customer', () => {
      expect(component.accounts(null)).toEqual([]);
      expect(component.totalBalance(null)).toBe(0);
      expect(component.recentActivity(null)).toEqual([]);
      expect(component.activeLoan(null)).toBeNull();
    });
  });

  describe('activity pagination', () => {
    it('slices the activity ledger to the page size', () => {
      const total = component.activityCount;
      expect(component.pagedActivity.length).toBe(Math.min(total, component.activityPageSize));
      expect(component.totalActivityPages).toBe(Math.max(1, Math.ceil(total / component.activityPageSize)));
    });

    it('clamps page navigation to the valid range', () => {
      component.setActivityPage(99);
      expect(component.activityPage).toBe(component.totalActivityPages);

      component.setActivityPage(0);
      expect(component.activityPage).toBe(1);
    });

    it('reports a 0-of-0 range when there is no activity', () => {
      component.selected = null;
      expect(component.activityCount).toBe(0);
      expect(component.activityRangeStart).toBe(0);
      expect(component.activityRangeEnd).toBe(0);
      expect(component.totalActivityPages).toBe(1);
    });
  });

  describe('riskTone()', () => {
    it('maps statuses to pill tones', () => {
      expect(component.riskTone('Priority customer')).toBe('demo-status-info');
      expect(component.riskTone('Loan review')).toBe('demo-status-warning');
      expect(component.riskTone('New onboarding')).toBe('demo-status-info');
      expect(component.riskTone('Active')).toBe('demo-status-success');
    });
  });
});
