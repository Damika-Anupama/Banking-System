import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ManagerAuditLogComponent } from './manager.audit-log.component';

describe('ManagerAuditLogComponent', () => {
  let component: ManagerAuditLogComponent;
  let fixture: ComponentFixture<ManagerAuditLogComponent>;

  const trail = [
    { id: 'A1', timestamp: '2026-05-10T09:00:00', actor: 'Manager', category: 'Loan',     action: 'Loan approved',      detail: 'LN-1', outcome: 'Approved' },
    { id: 'A2', timestamp: '2026-05-12T15:30:00', actor: 'System',  category: 'Security', action: 'Login flagged',      detail: 'IP',   outcome: 'Flagged' },
    { id: 'A3', timestamp: '2026-05-11T11:15:00', actor: 'Teller',  category: 'Account',  action: 'Account created',    detail: 'AC-9', outcome: 'Created' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManagerAuditLogComponent],
      imports: [CommonModule, FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerAuditLogComponent);
    component = fixture.componentInstance;

    component.entries = trail.map((e) => ({ ...e })) as any;
  });

  const ids = () => component.filteredEntries.map((e) => e.id);

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  describe('search and filter', () => {
    it('matches a search against actor, action and detail', () => {
      component.searchTerm = 'teller';
      expect(ids()).toEqual(['A3']);
    });

    it('filters by category', () => {
      component.categoryFilter = 'Security';
      expect(ids()).toEqual(['A2']);
    });
  });

  describe('sorting by time', () => {
    it('leaves the trail in its own order until asked to sort', () => {
      expect(component.sort.column).toBeNull();
      expect(ids()).toEqual(['A1', 'A2', 'A3']);
    });

    it('sorts newest first on the first click', () => {
      component.toggleSort('time');

      expect(ids()).toEqual(['A2', 'A3', 'A1']);
    });

    it('sorts oldest first on the second click', () => {
      component.toggleSort('time');
      component.toggleSort('time');

      expect(ids()).toEqual(['A1', 'A3', 'A2']);
    });

    it('cycles back to the trail order on a third click', () => {
      component.toggleSort('time');
      component.toggleSort('time');
      component.toggleSort('time');

      expect(component.sort.column).toBeNull();
      expect(ids()).toEqual(['A1', 'A2', 'A3']);
    });

    it('exposes the sort state for assistive tech', () => {
      expect(component.sort.stateFor('time')).toBe('none');

      component.toggleSort('time');
      expect(component.sort.stateFor('time')).toBe('descending');
    });
  });

  describe('paginating the trail', () => {
    beforeEach(() => {
      component.entries = Array.from({ length: 19 }, (_, i) => ({
        id: `E${i + 1}`,
        timestamp: '2026-05-01T10:00:00',
        actor: 'Manager',
        category: 'Loan',
        action: `Event ${i + 1}`,
        detail: '',
        outcome: 'Approved'
      })) as any;
    });

    it('pages eight entries at a time', () => {
      expect(component.pagedEntries.length).toBe(8);
      expect(component.auditRangeStart).toBe(1);
      expect(component.auditRangeEnd).toBe(8);
      expect(component.totalAuditPages).toBe(3);
    });

    it('clamps the page to the valid range', () => {
      component.setAuditPage(99);
      expect(component.auditPage).toBe(3);

      component.setAuditPage(0);
      expect(component.auditPage).toBe(1);
    });

    it('shows the short last page correctly', () => {
      component.setAuditPage(3);

      expect(component.pagedEntries.length).toBe(3);
      expect(component.auditRangeStart).toBe(17);
      expect(component.auditRangeEnd).toBe(19);
    });

    it('starts a new search or category filter back at page 1', () => {
      component.setAuditPage(3);

      component.searchTerm = 'Event 1';
      component.onFilterChange();

      expect(component.auditPage).toBe(1);
    });

    it('reports 0–0 of 0 when nothing matches', () => {
      component.searchTerm = 'nothing-matches-this';

      expect(component.auditCount).toBe(0);
      expect(component.auditRangeStart).toBe(0);
      expect(component.auditRangeEnd).toBe(0);
      expect(component.totalAuditPages).toBe(1);
    });
  });
});
