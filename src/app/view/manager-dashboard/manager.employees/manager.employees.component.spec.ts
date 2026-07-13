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
});
