import { Component, OnInit } from '@angular/core';
import { demoStore } from 'src/app/shared/demo-store';

interface Customer360Account {
  account_id: string;
  type: string;
  balance: number;
  status: string;
}

interface Customer360Activity {
  date: string;
  type: string;
  amount: number;
  direction: 'in' | 'out';
}

@Component({
  selector: 'app-employee.customer360',
  standalone: false,
  templateUrl: './employee.customer360.component.html',
  styleUrls: ['./employee.customer360.component.scss']
})
export class EmployeeCustomer360Component implements OnInit {
  customers: any[] = demoStore.getCustomers();
  searchTerm = '';
  selected: any | null = this.customers.length ? this.customers[0] : null;

  /** True while the customer profile and activity are being read into the view. */
  isLoading = true;

  /** Rough shape of the activity table so the loading skeleton holds the layout. */
  readonly activitySkeletonColumns = ['Date', 'Type', 'Direction', 'Amount'];

  ngOnInit(): void {
    // The demo store resolves synchronously, but the flag keeps the page on
    // the same skeleton-while-loading pattern as the customer pages.
    this.isLoading = false;
  }

  get filteredCustomers(): any[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.customers;
    return this.customers.filter(c =>
      [c.fullname, c.user_id, c.username, c.email, c.status].join(' ').toLowerCase().includes(q)
    );
  }

  select(customer: any): void {
    this.selected = customer;
    // A different customer means a different ledger; restart its pagination.
    this.activityPage = 1;
  }

  activityPage = 1;
  readonly activityPageSize = 5;

  get activityCount(): number {
    return this.recentActivity(this.selected).length;
  }

  get totalActivityPages(): number {
    return Math.max(1, Math.ceil(this.activityCount / this.activityPageSize));
  }

  get pagedActivity(): Customer360Activity[] {
    const page = Math.min(this.activityPage, this.totalActivityPages);
    const start = (page - 1) * this.activityPageSize;
    return this.recentActivity(this.selected).slice(start, start + this.activityPageSize);
  }

  get activityRangeStart(): number {
    return this.activityCount === 0 ? 0 : (Math.min(this.activityPage, this.totalActivityPages) - 1) * this.activityPageSize + 1;
  }

  get activityRangeEnd(): number {
    return Math.min(this.activityRangeStart + this.activityPageSize - 1, this.activityCount);
  }

  setActivityPage(page: number): void {
    this.activityPage = Math.max(1, Math.min(page, this.totalActivityPages));
  }

  initials(name: string): string {
    return (name || '')
      .split(' ')
      .map(p => p.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  accounts(customer: any | null): Customer360Account[] {
    if (!customer) return [];
    return demoStore.getCustomerAccounts(customer.user_id);
  }

  totalBalance(customer: any | null): number {
    return this.accounts(customer).reduce((sum, a) => sum + Number(a.balance || 0), 0);
  }

  recentActivity(customer: any | null): Customer360Activity[] {
    if (!customer) return [];
    return demoStore.getCustomerActivity(customer.user_id);
  }

  /**
   * Active lending is read live from the loan-approval queue, not invented —
   * so a customer with an application in review shows it here, and it clears
   * the moment a manager approves or rejects that application.
   */
  activeLoan(customer: any | null): { id: string; outstanding: number; type: string } | null {
    if (!customer) return null;
    const loan = demoStore
      .getLoanApplications()
      .find((l) => String(l.customer_id) === String(customer.user_id));
    if (!loan) return null;
    return {
      id: loan.loan_basic_detail_id,
      outstanding: Number(loan.amount || 0),
      type: loan.loan_type || 'Loan'
    };
  }

  riskTone(status: string): string {
    if (status === 'Priority customer') return 'demo-status-info';
    if (status === 'Loan review') return 'demo-status-warning';
    if (status === 'New onboarding') return 'demo-status-info';
    return 'demo-status-success';
  }
}
