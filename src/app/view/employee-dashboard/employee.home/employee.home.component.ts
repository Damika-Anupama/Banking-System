import { Component, OnInit, OnDestroy } from '@angular/core';
import { EmployeeHomeService } from 'src/app/service/employee/employee.home.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';
import { TableSort } from 'src/app/shared/table-sort';

@Component({
  selector: 'app-employee.home',
  standalone: false,
  templateUrl: './employee.home.component.html',
  styleUrls: ['./employee.home.component.scss']
})
export class EmployeeHomeComponent implements OnInit, OnDestroy {
  customers: any[] | null = null;
  searchTerm = '';
  customerPage = 1;
  readonly customerPageSize = 6;
  isLoading = false;
  errorMessage = '';
  private subscriptions: Subscription[] = [];

  /** Rough shape of the customer table so the loading skeleton holds the layout. */
  readonly customerSkeletonColumns = ['#', 'Customer', 'Gender', 'Date of birth', 'Email'];

  readonly sort = new TableSort<any>({
    name: (c) => String(c?.fullname || '').toLowerCase(),
    dob: (c) => new Date(c?.dob || 0).getTime(),
    email: (c) => String(c?.email || '').toLowerCase(),
  });

  toggleSort(column: string): void {
    this.sort.toggle(column);
    // Reordering restarts pagination so the new first rows are visible.
    this.customerPage = 1;
  }

  get filteredCustomers(): any[] {
    const list = this.customers || [];
    const q = this.searchTerm.trim().toLowerCase();
    const matched = !q
      ? list
      : list.filter(c =>
          [c.fullname, c.username, c.user_id, c.email, c.status, String(c.account_count)]
            .some(v => v && String(v).toLowerCase().includes(q))
        );

    return this.sort.apply(matched);
  }

  get totalCustomerPages(): number {
    return Math.max(1, Math.ceil(this.filteredCustomers.length / this.customerPageSize));
  }

  get pagedCustomers(): any[] {
    const page = Math.min(this.customerPage, this.totalCustomerPages);
    const start = (page - 1) * this.customerPageSize;
    return this.filteredCustomers.slice(start, start + this.customerPageSize);
  }

  get customerRangeStart(): number {
    return this.filteredCustomers.length === 0 ? 0 : (Math.min(this.customerPage, this.totalCustomerPages) - 1) * this.customerPageSize + 1;
  }

  get customerRangeEnd(): number {
    return Math.min(this.customerRangeStart + this.customerPageSize - 1, this.filteredCustomers.length);
  }

  onCustomerSearchChange(): void {
    this.customerPage = 1;
  }

  setCustomerPage(page: number): void {
    this.customerPage = Math.max(1, Math.min(page, this.totalCustomerPages));
  }

  private byStatus(status: string): any[] {
    return (this.customers || []).filter(c => (c.status || '').toLowerCase() === status.toLowerCase());
  }

  byStatusCount(status: string): number {
    return this.byStatus(status).length;
  }

  get customerCount(): number {
    return (this.customers || []).length;
  }

  get readyCount(): number {
    // Everyone except those still onboarding is ready for banking services.
    return (this.customers || []).filter(c => (c.status || '').toLowerCase() !== 'new onboarding').length;
  }

  get needsAttentionCount(): number {
    return (this.customers || []).filter(c => {
      const s = (c.status || '').toLowerCase();
      return s === 'loan review' || s === 'new onboarding';
    }).length;
  }

  get loanReviewCustomer(): any | null {
    return this.byStatus('Loan review')[0] || null;
  }

  get onboardingCustomer(): any | null {
    return this.byStatus('New onboarding')[0] || null;
  }

  get priorityCustomer(): any | null {
    const flagged = this.byStatus('Priority customer')[0];
    if (flagged) return flagged;
    return [...(this.customers || [])].sort((a, b) => (b.account_count || 0) - (a.account_count || 0))[0] || null;
  }

  firstName(customer: any | null): string {
    return customer?.fullname ? String(customer.fullname).split(' ')[0] : '—';
  }

  constructor(private home: EmployeeHomeService, private toastService: ToastService) { }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const sub = this.home.getEmployeeHome().subscribe({
      next: (data) => {
        try {
          // Null/undefined checks
          if (!data) {
            this.errorMessage = 'No data received from server';
            this.isLoading = false;
            this.toastService.error('Could not load customers', this.errorMessage);
            return;
          }

          // Check if data.data exists and is an array
          if (!data.data || !Array.isArray(data.data)) {
            this.errorMessage = 'Invalid data format received';
            this.customers = [];
            this.isLoading = false;
            this.toastService.warning('No customer data', 'No customer data available.');
            return;
          }

          this.customers = data.data;
          this.isLoading = false;

        } catch (error) {
          console.error('Error processing customer data:', error);
          this.errorMessage = 'Failed to process customer data';
          this.isLoading = false;
          this.toastService.error('Could not load customers', this.errorMessage);
        }
      },
      error: (err) => {
        console.error('Error loading customers:', err);
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load customers';
        this.isLoading = false;

        this.toastService.error('Could not load customers', this.errorMessage);
      }
    });

    this.subscriptions.push(sub);
  }

  showCustomerDetails(customer: any): void {
    if (!customer) {
      return;
    }

    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      title: customer.fullname || customer.username || 'Customer detail',
      html: `
        <div class="demo-detail-grid">
          <div class="demo-detail-row"><span>User ID</span><strong>${customer.user_id || 'N/A'}</strong></div>
          <div class="demo-detail-row"><span>Email</span><strong>${customer.email || 'N/A'}</strong></div>
          <div class="demo-detail-row"><span>Contact</span><strong>${customer.contact_no || customer.contact_num || 'N/A'}</strong></div>
          <div class="demo-detail-row"><span>Address</span><strong>${customer.address || 'N/A'}</strong></div>
          <div class="demo-detail-row"><span>Accounts</span><strong>${customer.account_count || 0}</strong></div>
          <div class="demo-detail-row"><span>Status</span><strong>${customer.status || 'Active'}</strong></div>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Close'
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
