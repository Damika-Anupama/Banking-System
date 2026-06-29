import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';

interface PaletteItem {
  label: string;
  description: string;
  icon: string;
  route: string;
  roles: string[];
}

const ALL_ITEMS: PaletteItem[] = [
  // Public
  { label: 'Welcome', description: 'Landing page', icon: 'fa-home', route: '/welcome', roles: ['*'] },
  { label: 'Sign in', description: 'Online banking login', icon: 'fa-right-to-bracket', route: '/sign-in', roles: ['*'] },
  { label: 'Create account', description: 'New customer registration', icon: 'fa-user-plus', route: '/sign-up', roles: ['*'] },
  // Customer
  { label: 'Dashboard overview', description: 'Account balances & activity', icon: 'fa-gauge', route: '/dashboard/home', roles: ['CUSTOMER', 'DEMO'] },
  { label: 'Transfer money', description: 'Send funds & payment history', icon: 'fa-paper-plane', route: '/dashboard/transaction', roles: ['CUSTOMER', 'DEMO'] },
  { label: 'Standing orders', description: 'Bill payments & recurring transfers', icon: 'fa-repeat', route: '/dashboard/payments', roles: ['CUSTOMER', 'DEMO'] },
  { label: 'Fixed deposits', description: 'Invest & track deposits', icon: 'fa-vault', route: '/dashboard/fixed-deposit', roles: ['CUSTOMER', 'DEMO'] },
  { label: 'Loans', description: 'FD-backed loans & installments', icon: 'fa-hand-holding-dollar', route: '/dashboard/loan', roles: ['CUSTOMER', 'DEMO'] },
  { label: 'My cards', description: 'Debit & credit card management', icon: 'fa-credit-card', route: '/dashboard/cards', roles: ['CUSTOMER', 'DEMO'] },
  { label: 'Customer settings', description: 'Profile & security settings', icon: 'fa-cog', route: '/dashboard/settings', roles: ['CUSTOMER', 'DEMO'] },
  // Employee
  { label: 'Employee home', description: 'Branch queue & customer service', icon: 'fa-gauge-high', route: '/employee-dashboard/employee-home', roles: ['EMPLOYEE', 'DEMO'] },
  { label: 'Register customer', description: 'New customer onboarding', icon: 'fa-user-plus', route: '/employee-dashboard/employee-register-customer', roles: ['EMPLOYEE', 'DEMO'] },
  { label: 'Cash deposit', description: 'Process customer deposits', icon: 'fa-money-bill-trend-up', route: '/employee-dashboard/employee-deposit', roles: ['EMPLOYEE', 'DEMO'] },
  { label: 'Withdrawal', description: 'Process cash withdrawal requests', icon: 'fa-money-bill-wave', route: '/employee-dashboard/employee-withdraw', roles: ['EMPLOYEE', 'DEMO'] },
  { label: 'Create loan', description: 'Manual loan application entry', icon: 'fa-file-signature', route: '/employee-dashboard/employee-create-loan', roles: ['EMPLOYEE', 'DEMO'] },
  { label: 'Customer 360', description: 'Full customer relationship view', icon: 'fa-user-magnifying-glass', route: '/employee-dashboard/employee-customer360', roles: ['EMPLOYEE', 'DEMO'] },
  { label: 'Cheque clearing', description: 'Process and clear cheques', icon: 'fa-file-invoice-dollar', route: '/employee-dashboard/employee-cheque-clearing', roles: ['EMPLOYEE', 'DEMO'] },
  { label: 'Service requests', description: 'Customer support tickets', icon: 'fa-headset', route: '/employee-dashboard/employee-service-requests', roles: ['EMPLOYEE', 'DEMO'] },
  { label: 'My performance', description: 'Daily targets & activity metrics', icon: 'fa-chart-bar', route: '/employee-dashboard/employee-performance', roles: ['EMPLOYEE', 'DEMO'] },
  // Manager
  { label: 'Manager home', description: 'Branch performance command center', icon: 'fa-chart-line', route: '/manager-dashboard/manager-home', roles: ['MANAGER', 'DEMO'] },
  { label: 'Loan approvals', description: 'Review pending loan applications', icon: 'fa-stamp', route: '/manager-dashboard/manager-loan-approval', roles: ['MANAGER', 'DEMO'] },
  { label: 'Employee management', description: 'Branch staff directory', icon: 'fa-users', route: '/manager-dashboard/manager-employees', roles: ['MANAGER', 'DEMO'] },
  { label: 'Branch reports', description: 'Analytics, cash flow & portfolio', icon: 'fa-chart-pie', route: '/manager-dashboard/manager-reports', roles: ['MANAGER', 'DEMO'] },
  { label: 'Announcements', description: 'Post and pin team notices', icon: 'fa-bullhorn', route: '/manager-dashboard/manager-announcements', roles: ['MANAGER', 'DEMO'] },
  { label: 'Product configuration', description: 'Manage banking products & rates', icon: 'fa-layer-group', route: '/manager-dashboard/manager-products', roles: ['MANAGER', 'DEMO'] },
  { label: 'Audit log', description: 'Activity trail & compliance view', icon: 'fa-shield-halved', route: '/manager-dashboard/manager-audit-log', roles: ['MANAGER', 'DEMO'] },
];

@Component({
  selector: 'app-command-palette',
  standalone: false,
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.scss']
})
export class CommandPaletteComponent {
  isOpen = false;
  query = '';
  selectedIndex = 0;

  constructor(private router: Router) {}

  private get userRole(): string {
    const type = localStorage.getItem('userType');
    const demo = localStorage.getItem('demoMode');
    if (type) return type;
    if (demo) return 'DEMO';
    return '*';
  }

  get items(): PaletteItem[] {
    const role = this.userRole;
    const q = this.query.toLowerCase().trim();
    const roleItems = ALL_ITEMS.filter(item =>
      item.roles.includes(role) || item.roles.includes('*') ||
      (role === 'DEMO' && item.roles.some(r => r !== '*'))
    );
    if (!q) return roleItems.slice(0, 8);
    return roleItems.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    ).slice(0, 10);
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
      return;
    }
    if (!this.isOpen) return;
    switch (event.key) {
      case 'Escape':
        this.close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.items.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        break;
      case 'Enter': {
        const item = this.items[this.selectedIndex];
        if (item) this.navigate(item);
        break;
      }
    }
  }

  open(): void {
    this.isOpen = true;
    this.query = '';
    this.selectedIndex = 0;
    setTimeout(() => {
      const input = document.getElementById('palette-search-input');
      if (input) input.focus();
    }, 30);
  }

  close(): void {
    this.isOpen = false;
    this.query = '';
    this.selectedIndex = 0;
  }

  onSearchInput(event: Event): void {
    this.query = (event.target as HTMLInputElement).value;
    this.selectedIndex = 0;
  }

  navigate(item: PaletteItem): void {
    this.router.navigate([item.route]);
    this.close();
  }
}
