/**
 * Unit Tests for PaymentsComponent
 *
 * Focus: standing-order aggregates (monthlyCommitted, nextPayment),
 * form validity, and the relative due-date urgency helpers.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PaymentsComponent } from './payments.component';

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
});
