/**
 * Unit Tests for PaymentsComponent
 *
 * Focus: standing-order aggregates (monthlyCommitted, nextPayment),
 * form validity, and the relative due-date urgency helpers.
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PaymentsComponent } from './payments.component';
import { ToastService } from 'src/app/service/toast.service';
import { demoStore } from 'src/app/shared/demo-store';

describe('PaymentsComponent', () => {
  let component: PaymentsComponent;
  let fixture: ComponentFixture<PaymentsComponent>;

  // Build a LOCAL yyyy-mm-dd string offset from today by `days`
  // (toISOString would use UTC and drift a day in negative-UTC timezones).
  const dateOffset = (days: number): string => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaymentsComponent],
      imports: [FormsModule, CommonModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loading state', () => {
    it('clears the loading flag once orders are read in ngOnInit', () => {
      fixture.detectChanges();
      expect(component.isLoading).toBeFalse();
    });

    it('shows the table skeleton while loading and the table shell after', () => {
      fixture.detectChanges();

      component.isLoading = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-skeleton-table')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.demo-table-shell')).toBeFalsy();

      component.isLoading = false;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-skeleton-table')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('.demo-table-shell')).toBeTruthy();
    });
  });

  describe('isValid', () => {
    it('is false until all required fields are present', () => {
      component.payee = '';
      component.accountId = '';
      component.amount = null;
      expect(component.isValid).toBeFalse();
    });

    it('is true when payee, account, positive amount and date are set', () => {
      component.payee = 'Ceylon Electricity Board';
      component.accountId = 'ACC-880021';
      component.amount = 5000;
      component.nextDate = dateOffset(7);
      expect(component.isValid).toBeTrue();
    });

    it('rejects a non-positive amount', () => {
      component.payee = 'X';
      component.accountId = 'ACC-1';
      component.amount = 0;
      component.nextDate = dateOffset(1);
      expect(component.isValid).toBeFalse();
    });
  });

  describe('monthlyCommitted', () => {
    it('normalises weekly and quarterly orders to a monthly figure', () => {
      component.orders = [
        { status: 'Active', frequency: 'Monthly', amount: 1000 },
        { status: 'Active', frequency: 'Weekly', amount: 100 }, // ~400/mo
        { status: 'Active', frequency: 'Quarterly', amount: 300 }, // 100/mo
        { status: 'Paused', frequency: 'Monthly', amount: 9999 }, // excluded
      ];
      expect(component.monthlyCommitted).toBe(1500);
    });
  });

  describe('nextPayment', () => {
    it('returns the soonest active order', () => {
      component.orders = [
        { status: 'Active', payee: 'Later', next_date: dateOffset(10) },
        { status: 'Active', payee: 'Soonest', next_date: dateOffset(2) },
        { status: 'Paused', payee: 'Ignored', next_date: dateOffset(1) },
      ];
      expect(component.nextPayment.payee).toBe('Soonest');
    });

    it('returns null when there are no active orders', () => {
      component.orders = [{ status: 'Paused', next_date: dateOffset(1) }];
      expect(component.nextPayment).toBeNull();
    });
  });

  describe('dueLabel() / dueClass()', () => {
    it('labels a paused order regardless of date', () => {
      const order = { status: 'Paused', next_date: dateOffset(-5) };
      expect(component.dueLabel(order)).toBe('Paused');
      expect(component.dueClass(order)).toBe('text-white/40');
    });

    it('flags overdue active orders in rose', () => {
      const order = { status: 'Active', next_date: dateOffset(-3) };
      expect(component.dueLabel(order)).toBe('Overdue by 3d');
      expect(component.dueClass(order)).toBe('text-rose-300');
    });

    it('labels today and tomorrow with amber urgency', () => {
      const today = { status: 'Active', next_date: dateOffset(0) };
      const tomorrow = { status: 'Active', next_date: dateOffset(1) };
      expect(component.dueLabel(today)).toBe('Due today');
      expect(component.dueLabel(tomorrow)).toBe('Due tomorrow');
      expect(component.dueClass(today)).toBe('text-amber-300');
      expect(component.dueClass(tomorrow)).toBe('text-amber-300');
    });

    it('labels distant dates in emerald', () => {
      const order = { status: 'Active', next_date: dateOffset(9) };
      expect(component.dueLabel(order)).toBe('Due in 9 days');
      expect(component.dueClass(order)).toBe('text-emerald-300');
    });
  });

  describe('standing-order pagination', () => {
    const manyOrders = Array.from({ length: 6 }, (_, i) => ({
      id: `SO-${i + 1}`,
      payee: `Payee ${i + 1}`,
      account_id: `ACC-88000${i + 1}`,
      category: 'Utilities',
      status: 'Active',
      frequency: 'Monthly',
      amount: 1000,
      next_date: dateOffset(i + 1),
    }));

    it('pages orders five at a time', () => {
      component.orders = [...manyOrders];

      expect(component.orderCount).toBe(6);
      expect(component.totalOrderPages).toBe(2);
      expect(component.pagedOrders.length).toBe(5);

      component.setOrderPage(2);

      expect(component.pagedOrders.length).toBe(1);
      expect(component.orderRangeStart).toBe(6);
      expect(component.orderRangeEnd).toBe(6);
    });

    it('clamps out-of-range pages', () => {
      component.orders = [manyOrders[0]];

      component.setOrderPage(99);
      expect(component.orderPage).toBe(1);

      component.setOrderPage(0);
      expect(component.orderPage).toBe(1);
    });

    it('reports an empty range when there are no orders', () => {
      component.orders = [];

      expect(component.orderCount).toBe(0);
      expect(component.totalOrderPages).toBe(1);
      expect(component.orderRangeStart).toBe(0);
      expect(component.orderRangeEnd).toBe(0);
      expect(component.pagedOrders).toEqual([]);
    });

    it('resets to page 1 when a new order is created', fakeAsync(() => {
      const stored = [...manyOrders];
      spyOn(demoStore, 'getStandingOrders').and.returnValue(stored);
      spyOn(demoStore, 'getBeneficiaries').and.returnValue([]);
      spyOn(demoStore, 'addStandingOrder').and.callFake((order: any) => stored.unshift(order));
      const toastService = TestBed.inject(ToastService);
      spyOn(toastService, 'success');

      component.orders = stored;
      component.setOrderPage(2);
      expect(component.orderPage).toBe(2);

      component.payee = 'Ceylon Electricity Board';
      component.accountId = 'ACC-880021';
      component.amount = 5000;
      component.nextDate = dateOffset(7);

      component.setUpOrder();
      tick(400);

      expect(demoStore.addStandingOrder).toHaveBeenCalled();
      expect(component.orderPage).toBe(1);
      expect(component.pagedOrders[0].payee).toBe('Ceylon Electricity Board');
      expect(component.isSaving).toBeFalse();
    }));
  });
});
