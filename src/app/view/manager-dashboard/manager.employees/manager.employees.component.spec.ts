import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import Swal from 'sweetalert2';

import { ManagerEmployeesComponent } from './manager.employees.component';
import { ToastService } from 'src/app/service/toast.service';

describe('ManagerEmployeesComponent', () => {
  let component: ManagerEmployeesComponent;
  let fixture: ComponentFixture<ManagerEmployeesComponent>;
  let toastService: ToastService;

  const roster = [
    { employee_id: 'E1', fullname: 'Zara Perera',  username: 'zara', role: 'Teller',  email: 'z@x.lk', contact_no: '1', joined_date: '2024-01-01', transactions_handled: 50,  status: 'Active' },
    { employee_id: 'E2', fullname: 'Amal Silva',   username: 'amal', role: 'Manager', email: 'a@x.lk', contact_no: '2', joined_date: '2026-01-01', transactions_handled: 900, status: 'Inactive' },
    { employee_id: 'E3', fullname: 'Mira Fonseka', username: 'mira', role: 'Teller',  email: 'm@x.lk', contact_no: '3', joined_date: '2025-01-01', transactions_handled: 300, status: 'Active' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManagerEmployeesComponent],
      imports: [CommonModule, FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerEmployeesComponent);
    component = fixture.componentInstance;

    toastService = TestBed.inject(ToastService);
    spyOn(toastService, 'success');

    // deactivate/reactivate chains .then() off the confirmation dialog.
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false }) as any);

    component.employees = roster.map((e) => ({ ...e })) as any;
  });

  const names = () => component.filteredEmployees.map((e) => e.fullname);

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  describe('search and filter', () => {
    it('matches a search against name, id, username, email and role', () => {
      component.searchTerm = 'mira';
      expect(names()).toEqual(['Mira Fonseka']);

      component.searchTerm = 'manager';
      expect(names()).toEqual(['Amal Silva']);
    });

    it('filters by role', () => {
      component.roleFilter = 'Teller';

      expect(names()).toEqual(['Zara Perera', 'Mira Fonseka']);
    });
  });

  describe('sorting the roster', () => {
    it('leaves the roster in its own order until asked to sort', () => {
      expect(component.sort.column).toBeNull();
      expect(names()).toEqual(['Zara Perera', 'Amal Silva', 'Mira Fonseka']);
    });

    it('sorts by name', () => {
      component.toggleSort('name');
      component.toggleSort('name'); // ascending

      expect(names()).toEqual(['Amal Silva', 'Mira Fonseka', 'Zara Perera']);
    });

    it('sorts by transactions handled, busiest first', () => {
      component.toggleSort('handled');

      expect(names()).toEqual(['Amal Silva', 'Mira Fonseka', 'Zara Perera']);
    });

    it('sorts by joined date, most recent first', () => {
      component.toggleSort('joined');

      expect(names()).toEqual(['Amal Silva', 'Mira Fonseka', 'Zara Perera']);
    });

    it('cycles back to the roster order on a third click', () => {
      component.toggleSort('handled');
      component.toggleSort('handled');
      component.toggleSort('handled');

      expect(component.sort.column).toBeNull();
      expect(names()).toEqual(['Zara Perera', 'Amal Silva', 'Mira Fonseka']);
    });

    it('sorts and filters together, rather than one replacing the other', () => {
      component.roleFilter = 'Teller';
      component.toggleSort('handled');

      // Only tellers, and the busiest of them first.
      expect(names()).toEqual(['Mira Fonseka', 'Zara Perera']);
    });

    it('exposes the sort state for assistive tech', () => {
      expect(component.sort.stateFor('handled')).toBe('none');

      component.toggleSort('handled');
      expect(component.sort.stateFor('handled')).toBe('descending');
      expect(component.sort.stateFor('name')).toBe('none');
    });
  });

  describe('paginating the roster', () => {
    beforeEach(() => {
      component.employees = Array.from({ length: 14 }, (_, i) => ({
        employee_id: `EMP-${i + 1}`,
        fullname: `Employee ${i + 1}`,
        username: `emp${i + 1}`,
        role: 'Teller',
        email: `e${i + 1}@x.lk`,
        contact_no: String(i),
        joined_date: '2025-01-01',
        transactions_handled: i,
        status: 'Active'
      })) as any;
    });

    it('pages six employees at a time', () => {
      expect(component.pagedEmployees.length).toBe(6);
      expect(component.rosterRangeStart).toBe(1);
      expect(component.rosterRangeEnd).toBe(6);
      expect(component.totalRosterPages).toBe(3);
    });

    it('clamps the page to the valid range', () => {
      component.setRosterPage(99);
      expect(component.rosterPage).toBe(3);

      component.setRosterPage(0);
      expect(component.rosterPage).toBe(1);
    });

    it('shows the short last page correctly', () => {
      component.setRosterPage(3);

      expect(component.pagedEmployees.length).toBe(2);
      expect(component.rosterRangeStart).toBe(13);
      expect(component.rosterRangeEnd).toBe(14);
    });

    it('starts a new search or role filter back at page 1', () => {
      component.setRosterPage(3);

      component.searchTerm = 'Employee 1';
      component.onFilterChange();

      expect(component.rosterPage).toBe(1);
    });

    it('reports 0–0 of 0 when no employees match', () => {
      component.searchTerm = 'nobody-matches-this';

      expect(component.rosterCount).toBe(0);
      expect(component.rosterRangeStart).toBe(0);
      expect(component.rosterRangeEnd).toBe(0);
      expect(component.totalRosterPages).toBe(1);
    });
  });
});
