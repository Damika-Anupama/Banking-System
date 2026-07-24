/**
 * Unit Tests for CardsComponent
 *
 * Focus: credit-utilization health helpers (tier colour + label) and
 * available-credit math used by the cards UI.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CardsComponent } from './cards.component';

describe('CardsComponent', () => {
  let component: CardsComponent;
  let fixture: ComponentFixture<CardsComponent>;

  const card = (used: number, limit: number) => ({ credit_used: used, credit_limit: limit });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CardsComponent],
      imports: [CommonModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CardsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loading state', () => {
    it('clears the loading flag once cards are read in ngOnInit', () => {
      fixture.detectChanges();
      expect(component.isLoading).toBeFalse();
    });

    it('shows the skeleton while loading and the card grid after', () => {
      fixture.detectChanges();

      component.isLoading = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-skeleton-table')).toBeTruthy();

      component.isLoading = false;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-skeleton-table')).toBeFalsy();
    });
  });

  describe('availableCredit()', () => {
    it('returns limit minus used', () => {
      expect(component.availableCredit(card(40000, 100000))).toBe(60000);
    });

    it('handles missing fields as zero', () => {
      expect(component.availableCredit({})).toBe(0);
    });
  });

  describe('creditUsedPct()', () => {
    it('computes a rounded percentage', () => {
      expect(component.creditUsedPct(card(25000, 100000))).toBe(25);
    });

    it('returns 0 when there is no limit', () => {
      expect(component.creditUsedPct(card(5000, 0))).toBe(0);
    });

    it('caps at 100 when over limit', () => {
      expect(component.creditUsedPct(card(150000, 100000))).toBe(100);
    });
  });

  describe('credit-utilization health tiers', () => {
    it('is healthy below 30%', () => {
      const c = card(20000, 100000); // 20%
      expect(component.creditBarClass(c)).toBe('bg-emerald-400');
      expect(component.creditUtilizationLabel(c)).toBe('Healthy utilization');
      expect(component.creditLabelClass(c)).toBe('text-emerald-200');
    });

    it('is moderate between 30% and 70%', () => {
      const c = card(50000, 100000); // 50%
      expect(component.creditBarClass(c)).toBe('bg-amber-400');
      expect(component.creditUtilizationLabel(c)).toBe('Moderate utilization');
      expect(component.creditLabelClass(c)).toBe('text-amber-200');
    });

    it('is high at or above 70%', () => {
      const c = card(80000, 100000); // 80%
      expect(component.creditBarClass(c)).toBe('bg-rose-400');
      expect(component.creditUtilizationLabel(c)).toBe('High utilization');
      expect(component.creditLabelClass(c)).toBe('text-rose-200');
    });

    it('treats the 70% boundary as high', () => {
      const c = card(70000, 100000); // exactly 70%
      expect(component.creditBarClass(c)).toBe('bg-rose-400');
    });
  });

  describe('cardGradient()', () => {
    it('uses a muted gradient for frozen cards', () => {
      expect(component.cardGradient({ status: 'Frozen', type: 'Credit' })).toContain('slate');
    });

    it('differs by card type when active', () => {
      expect(component.cardGradient({ status: 'Active', type: 'Credit' })).toContain('violet');
      expect(component.cardGradient({ status: 'Active', type: 'Debit' })).toContain('cyan');
    });
  });
});
