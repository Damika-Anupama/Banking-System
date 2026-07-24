import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { EmployeeServiceRequestsComponent } from './employee.service-requests.component';
import { ToastService } from 'src/app/service/toast.service';
import { demoStore } from 'src/app/shared/demo-store';

describe('EmployeeServiceRequestsComponent', () => {
  let component: EmployeeServiceRequestsComponent;
  let fixture: ComponentFixture<EmployeeServiceRequestsComponent>;
  let toastService: ToastService;

  // The queue is backed by the shared demo store; reset it so each test starts
  // from the same fresh seed instead of inheriting a prior test's writes.
  beforeEach(() => demoStore.reset());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeServiceRequestsComponent],
      imports: [CommonModule, FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeServiceRequestsComponent);
    component = fixture.componentInstance;

    toastService = TestBed.inject(ToastService);
    spyOn(toastService, 'success');
    spyOn(toastService, 'error');
  });

  it('creates', () => {
    expect(component).toBeTruthy();
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
      expect(shell.getAttribute('aria-label')).toBe('Service request tickets');
    });

    it('shows an empty-state card when no tickets match the filters', () => {
      fixture.detectChanges();

      component.searchTerm = 'zzz-no-match';
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('.demo-table-shell .demo-state-card');
      expect(card).toBeTruthy();
      expect(card.textContent).toContain('No matching tickets');
    });
  });

  describe('form validation', () => {
    it('only surfaces an error once the field has been touched', () => {
      expect(component.errorFor('newCustomer')).toBeNull();

      component.markTouched('newCustomer');
      expect(component.errorFor('newCustomer')).toBe('Enter the customer name.');
    });

    it('rejects an incomplete form without creating a ticket', () => {
      const before = component.requests.length;

      component.createRequest();

      expect(toastService.error).toHaveBeenCalledWith(
        'Missing details',
        'Fix the highlighted fields to open the ticket.'
      );
      expect(component.requests.length).toBe(before);
      expect(component.touched['newCustomer']).toBeTrue();
      expect(component.touched['newSummary']).toBeTrue();
    });

    it('creates the ticket and resets the form when valid', fakeAsync(() => {
      const before = component.requests.length;
      component.newCustomer = 'Nuwan Silva';
      component.newSummary = 'Replace a damaged debit card.';
      component.ticketPage = 2;

      component.createRequest();
      tick(500);

      expect(component.requests.length).toBe(before + 1);
      expect(component.requests[0].customer).toBe('Nuwan Silva');
      expect(component.ticketPage).toBe(1);
      expect(component.newCustomer).toBe('');
      expect(component.newSummary).toBe('');
      expect(component.isSubmitting).toBeFalse();
      expect(toastService.success).toHaveBeenCalled();
    }));
  });

  describe('filtering', () => {
    it('filters by status', () => {
      component.statusFilter = 'Resolved';
      expect(component.filteredRequests.every(r => r.status === 'Resolved')).toBeTrue();
    });

    it('filters by search term across ticket fields', () => {
      const target = component.requests[0];
      component.searchTerm = String(target.ticket_id);
      expect(component.filteredRequests.length).toBeGreaterThan(0);
      expect(component.filteredRequests.some(r => r.ticket_id === target.ticket_id)).toBeTrue();
    });

    it('returns to the first page when a filter changes', () => {
      component.ticketPage = 2;
      component.onFilterChange();
      expect(component.ticketPage).toBe(1);
    });
  });

  describe('ticket pagination', () => {
    it('slices the queue to the page size', () => {
      const total = component.filteredRequests.length;
      expect(component.pagedRequests.length).toBe(Math.min(total, component.ticketPageSize));
      expect(component.totalTicketPages).toBe(Math.max(1, Math.ceil(total / component.ticketPageSize)));
    });

    it('clamps page navigation to the valid range', () => {
      component.setTicketPage(99);
      expect(component.ticketPage).toBe(component.totalTicketPages);

      component.setTicketPage(0);
      expect(component.ticketPage).toBe(1);
    });

    it('reports a 0-of-0 range when nothing matches', () => {
      component.searchTerm = 'zzz-no-match';
      expect(component.ticketRangeStart).toBe(0);
      expect(component.ticketRangeEnd).toBe(0);
      expect(component.totalTicketPages).toBe(1);
    });
  });

  describe('advancing tickets', () => {
    it('moves an open ticket to in progress', () => {
      const open = component.requests.find(r => r.status === 'Open') as any;

      component.advance(open);

      expect(component.requests.find(r => r.ticket_id === open.ticket_id)?.status).toBe('In progress');
      expect(toastService.success).toHaveBeenCalledWith('Marked in progress');
    });

    it('leaves resolved tickets untouched', () => {
      const resolved = { ticket_id: 'SR-X', status: 'Resolved' } as any;

      component.advance(resolved);

      expect(resolved.status).toBe('Resolved');
      expect(toastService.success).not.toHaveBeenCalled();
    });
  });

  describe('tones', () => {
    it('maps statuses to pill tones', () => {
      expect(component.statusTone('Resolved')).toBe('demo-status-success');
      expect(component.statusTone('In progress')).toBe('demo-status-info');
      expect(component.statusTone('Open')).toBe('demo-status-warning');
    });

    it('maps priorities to badge tones', () => {
      expect(component.priorityTone('High')).toContain('glass-pink');
      expect(component.priorityTone('Medium')).toContain('glass-cyan');
      expect(component.priorityTone('Low')).toContain('glass-emerald');
    });
  });
});
