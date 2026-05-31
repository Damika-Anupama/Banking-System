import { Component } from '@angular/core';
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
export class EmployeeCustomer360Component {
  customers: any[] = demoStore.getCustomers();
  searchTerm = '';
  selected: any | null = this.customers.length ? this.customers[0] : null;

  get filteredCustomers(): any[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.customers;
    return this.customers.filter(c =>
      [c.fullname, c.user_id, c.username, c.email, c.status].join(' ').toLowerCase().includes(q)
    );
  }

  select(customer: any): void {
    this.selected = customer;
  }

  initials(name: string): string {
    return (name || '')
      .split(' ')
      .map(p => p.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  /** Deterministic pseudo-random seed from a customer id so figures stay stable. */
  private seed(id: string): number {
    return String(id).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  }

  accounts(customer: any | null): Customer360Account[] {
    if (!customer) return [];
    const base = this.seed(customer.user_id);
    const count = Math.max(1, Number(customer.account_count) || 1);
    const types = ['Savings · Personal', 'Current · Personal', 'Savings · Organization', 'Fixed Deposit'];
    return Array.from({ length: count }).map((_, i) => ({
      account_id: 'ACC-' + (480000 + base + i * 137),
      type: types[(base + i) % types.length],
      balance: 50000 + ((base * (i + 3) * 911) % 1950000),
      status: 'Active'
    }));
  }

  totalBalance(customer: any | null): number {
    return this.accounts(customer).reduce((sum, a) => sum + a.balance, 0);
  }

  recentActivity(customer: any | null): Customer360Activity[] {
    if (!customer) return [];
    const base = this.seed(customer.user_id);
    const templates = [
      { type: 'Salary Credit', direction: 'in' as const },
      { type: 'Card Settlement', direction: 'out' as const },
      { type: 'Utility Payment', direction: 'out' as const },
      { type: 'Fund Transfer', direction: 'in' as const },
      { type: 'ATM Withdrawal', direction: 'out' as const }
    ];
    return templates.map((t, i) => ({
      date: new Date(2026, 4, 24 - i * 3).toISOString(),
      type: t.type,
      amount: 5000 + ((base * (i + 2) * 631) % 180000),
      direction: t.direction
    }));
  }

  activeLoan(customer: any | null): { id: string; outstanding: number; type: string } | null {
    if (!customer) return null;
    if (customer.status !== 'Loan review' && this.seed(customer.user_id) % 3 !== 0) return null;
    const base = this.seed(customer.user_id);
    return {
      id: 'LN-' + (49000 + (base % 900)),
      outstanding: 80000 + ((base * 523) % 900000),
      type: base % 2 === 0 ? 'Personal' : 'Business'
    };
  }

  riskTone(status: string): string {
    if (status === 'Priority customer') return 'demo-status-info';
    if (status === 'Loan review') return 'demo-status-warning';
    if (status === 'New onboarding') return 'demo-status-info';
    return 'demo-status-success';
  }
}
