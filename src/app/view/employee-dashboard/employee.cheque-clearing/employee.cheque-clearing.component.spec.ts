import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import Swal from 'sweetalert2';

import { EmployeeChequeClearingComponent } from './employee.cheque-clearing.component';
import { ToastService } from 'src/app/service/toast.service';

describe('EmployeeChequeClearingComponent', () => {
  let component: EmployeeChequeClearingComponent;
  let fixture: ComponentFixture<EmployeeChequeClearingComponent>;
  let toastService: ToastService;

  const chequeWith = (status: string): any =>
    component.cheques.find((c) => c.status === status);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeChequeClearingComponent],
      imports: [CommonModule, FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeChequeClearingComponent);
    component = fixture.componentInstance;

    toastService = TestBed.inject(ToastService);
    spyOn(toastService, 'success');

    // markReturned() chains .then() off the confirmation dialog.
    spyOn(Swal, 'fire').and.returnValue(
      Promise.resolve({ isConfirmed: true, value: 'Insufficient funds' }) as any
    );
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  describe('clearing lifecycle', () => {
    it('advances a received cheque into clearing, without a dialog', () => {
      const cheque = { ...chequeWith('Received'), status: 'Received' } as any;

      component.advance(cheque);

      expect(cheque.status).toBe('In clearing');
      expect(toastService.success).toHaveBeenCalledWith('Sent to clearing');
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('clears a cheque already in clearing, naming the credited account', () => {
      const cheque = { cheque_id: 'CHQ-1', account_id: 'ACC-492810', amount: 5000, status: 'In clearing' } as any;

      component.advance(cheque);

      expect(cheque.status).toBe('Cleared');
      expect(toastService.success).toHaveBeenCalledWith(
        'Cheque cleared',
        jasmine.stringMatching('ACC-492810')
      );
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('does not advance a cheque that is already cleared', () => {
      const cheque = { status: 'Cleared' } as any;

      expect(component.canAdvance(cheque)).toBe(false);

      component.advance(cheque);
      expect(cheque.status).toBe('Cleared');
    });
  });

  describe('marking a cheque returned', () => {
    it('asks for confirmation and a reason before marking it unpaid', fakeAsync(() => {
      const cheque = { cheque_no: '000123', amount: 5000, status: 'In clearing' } as any;

      component.markReturned(cheque);
      tick();

      // Bouncing a cheque is a consequential, non-obvious action: it stays modal
      // and requires a reason.
      expect(Swal.fire).toHaveBeenCalledWith(
        jasmine.objectContaining({ title: 'Mark cheque returned?', input: 'select' })
      );
      expect(cheque.status).toBe('Returned');
      expect(toastService.success).toHaveBeenCalledWith(
        'Marked returned',
        'Reason: Insufficient funds'
      );
    }));

    it('leaves the cheque untouched if the teller cancels', fakeAsync(() => {
      (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ isConfirmed: false }) as any);
      const cheque = { cheque_no: '000123', amount: 5000, status: 'In clearing' } as any;

      component.markReturned(cheque);
      tick();

      expect(cheque.status).toBe('In clearing');
      expect(toastService.success).not.toHaveBeenCalled();
    }));
  });
  describe('sorting the cheque queue', () => {
    const amounts = () => component.filteredCheques.map((c: any) => c.amount);

    it('sorts by amount, largest first', () => {
      component.toggleSort('amount');

      const sorted = amounts();
      expect(sorted).toEqual([...sorted].sort((a, b) => b - a));
    });

    it('cycles back to the queue order on a third click', () => {
      const original = amounts();

      component.toggleSort('amount');
      component.toggleSort('amount');
      component.toggleSort('amount');

      expect(component.sort.column).toBeNull();
      expect(amounts()).toEqual(original);
    });

    it('sorts and filters together, rather than one replacing the other', () => {
      component.statusFilter = 'Received' as any;
      component.toggleSort('amount');

      const rows = component.filteredCheques;
      expect(rows.every((c: any) => c.status === 'Received')).toBe(true);

      const sorted = rows.map((c: any) => c.amount);
      expect(sorted).toEqual([...sorted].sort((a, b) => b - a));
    });

    it('exposes the sort state for assistive tech', () => {
      expect(component.sort.stateFor('amount')).toBe('none');

      component.toggleSort('amount');
      expect(component.sort.stateFor('amount')).toBe('descending');
    });
  });

});
