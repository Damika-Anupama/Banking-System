import { Component } from '@angular/core';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';
import { focusFirstError } from 'src/app/shared/focus-first-error';

interface ServiceRequest {
  ticket_id: string;
  customer: string;
  customer_id: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In progress' | 'Resolved';
  opened: string;
  summary: string;
}

@Component({
  selector: 'app-employee.service-requests',
  standalone: false,
  templateUrl: './employee.service-requests.component.html',
  styleUrls: ['./employee.service-requests.component.scss']
})
export class EmployeeServiceRequestsComponent {
  constructor(private toastService: ToastService) {}

  searchTerm = '';
  statusFilter = 'all';

  // New request form
  newCustomer = '';
  newCategory = 'Card replacement';
  newPriority: 'Low' | 'Medium' | 'High' = 'Medium';
  newSummary = '';
  isSubmitting = false;

  readonly categories = ['Card replacement', 'Dispute / chargeback', 'Address change', 'Statement request', 'Cheque book', 'Account closure', 'Other'];

  requests: ServiceRequest[] = [
    { ticket_id: 'SR-7042', customer: 'Nuwan Silva',        customer_id: 'CUS-1002', category: 'Dispute / chargeback', priority: 'High',   status: 'Open',        opened: '2026-05-24T09:10:00', summary: 'Disputed card transaction of Rs. 18,500 at online merchant.' },
    { ticket_id: 'SR-7039', customer: 'Sofia Fernando',     customer_id: 'CUS-1003', category: 'Card replacement',    priority: 'Medium', status: 'In progress', opened: '2026-05-23T14:35:00', summary: 'Lost debit card, requested replacement and PIN reset.' },
    { ticket_id: 'SR-7035', customer: 'Ishan Jayawardena',  customer_id: 'CUS-1004', category: 'Address change',      priority: 'Low',    status: 'Open',        opened: '2026-05-23T11:05:00', summary: 'Update residential address after relocation to Wattala.' },
    { ticket_id: 'SR-7028', customer: 'Dilani Rajapaksa',   customer_id: 'CUS-1005', category: 'Statement request',   priority: 'Low',    status: 'Resolved',    opened: '2026-05-22T16:20:00', summary: 'Requested 6-month account statement for visa application.' },
    { ticket_id: 'SR-7021', customer: 'Kasun Mendis',       customer_id: 'CUS-1006', category: 'Cheque book',         priority: 'Medium', status: 'In progress', opened: '2026-05-21T10:45:00', summary: 'New cheque book request (50 leaves).' },
    { ticket_id: 'SR-7014', customer: 'Roshan Peiris',      customer_id: 'CUS-1008', category: 'Dispute / chargeback', priority: 'High',   status: 'Resolved',    opened: '2026-05-20T13:15:00', summary: 'Duplicate ATM withdrawal charge reversed.' }
  ];

  get filteredRequests(): ServiceRequest[] {
    const q = this.searchTerm.trim().toLowerCase();
    return this.requests.filter(r => {
      const matchesStatus = this.statusFilter === 'all' || r.status === this.statusFilter;
      const matchesSearch = !q || [r.ticket_id, r.customer, r.customer_id, r.category, r.summary].join(' ').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }

  get openCount(): number { return this.requests.filter(r => r.status === 'Open').length; }
  get inProgressCount(): number { return this.requests.filter(r => r.status === 'In progress').length; }
  get resolvedCount(): number { return this.requests.filter(r => r.status === 'Resolved').length; }
  get highPriorityCount(): number { return this.requests.filter(r => r.priority === 'High' && r.status !== 'Resolved').length; }

  touched: Record<string, boolean> = {};
  private readonly validatedFields = ['newCustomer', 'newSummary'];

  get fieldErrors(): Record<string, string | null> {
    return {
      newCustomer: this.newCustomer.trim() ? null : 'Enter the customer name.',
      newSummary: this.newSummary.trim() ? null : 'Describe the request in a short summary.',
    };
  }

  get isValid(): boolean {
    return this.validatedFields.every(field => !this.fieldErrors[field]);
  }

  /** The first field the form rejected, so focus can be sent straight to it. */
  get firstErrorField(): string | null {
    for (const field of this.validatedFields) {
      if (this.fieldErrors[field]) return field;
    }
    return null;
  }

  /** An error is only shown once the user has left the field, to avoid nagging mid-type. */
  errorFor(field: string): string | null {
    return this.touched[field] ? this.fieldErrors[field] : null;
  }

  markTouched(field: string): void {
    this.touched[field] = true;
  }

  statusTone(status: string): string {
    if (status === 'Resolved') return 'demo-status-success';
    if (status === 'In progress') return 'demo-status-info';
    return 'demo-status-warning';
  }

  priorityTone(priority: string): string {
    if (priority === 'High') return 'bg-gradient-to-r from-glass-pink/80 to-glass-orange/80';
    if (priority === 'Medium') return 'bg-gradient-to-r from-glass-cyan/80 to-glass-blue/80';
    return 'bg-gradient-to-r from-glass-emerald/80 to-glass-cyan/80';
  }

  createRequest(): void {
    if (!this.isValid) {
      this.validatedFields.forEach(field => (this.touched[field] = true));
      focusFirstError(this.firstErrorField);
      this.toastService.error('Missing details', 'Fix the highlighted fields to open the ticket.');
      return;
    }
    this.isSubmitting = true;
    const ticket: ServiceRequest = {
      ticket_id: 'SR-' + Math.floor(7100 + Math.random() * 899),
      customer: this.newCustomer.trim(),
      customer_id: '—',
      category: this.newCategory,
      priority: this.newPriority,
      status: 'Open',
      opened: new Date().toISOString(),
      summary: this.newSummary.trim()
    };
    setTimeout(() => {
      this.requests = [ticket, ...this.requests];
      this.newCustomer = '';
      this.newSummary = '';
      this.touched = {};
      this.newCategory = 'Card replacement';
      this.newPriority = 'Medium';
      this.isSubmitting = false;
      this.toastService.success('Ticket created', `Reference ${ticket.ticket_id} logged.`);
    }, 500);
  }

  advance(request: ServiceRequest): void {
    if (request.status === 'Open') {
      request.status = 'In progress';
      this.toastService.success('Marked in progress');
    } else if (request.status === 'In progress') {
      request.status = 'Resolved';
      this.toastService.success('Ticket resolved');
    }
  }

  view(request: ServiceRequest): void {
    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      title: request.ticket_id,
      html: `
        <div class="demo-detail-grid">
          <div class="demo-detail-row"><span>Customer</span><strong>${request.customer}</strong></div>
          <div class="demo-detail-row"><span>Category</span><strong>${request.category}</strong></div>
          <div class="demo-detail-row"><span>Priority</span><strong>${request.priority}</strong></div>
          <div class="demo-detail-row"><span>Status</span><strong>${request.status}</strong></div>
          <div class="demo-detail-row"><span>Opened</span><strong>${new Date(request.opened).toLocaleString()}</strong></div>
        </div>
        <p style="margin-top:12px;text-align:left">${request.summary}</p>
      `,
      confirmButtonText: 'Close'
    });
  }
}
