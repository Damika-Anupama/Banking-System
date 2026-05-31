import { Component } from '@angular/core';
import Swal from 'sweetalert2';
import { DEMO_EMPLOYEES } from 'src/app/shared/demo-banking-fixtures';
import { demoStore } from 'src/app/shared/demo-store';

interface RosterEmployee {
  employee_id: string;
  fullname: string;
  username: string;
  role: string;
  email: string;
  contact_no: string;
  joined_date: string;
  transactions_handled: number;
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-manager.employees',
  standalone: false,
  templateUrl: './manager.employees.component.html',
  styleUrls: ['./manager.employees.component.scss']
})
export class ManagerEmployeesComponent {
  searchTerm = '';
  roleFilter = 'all';
  employees: RosterEmployee[] = [];

  readonly roles = ['Teller', 'Customer Service Officer', 'Loan Officer', 'Operations Officer'];

  constructor() {
    this.load();
  }

  private load(): void {
    // Seed roster + any employees added via the "Add Employee" page this session.
    const added: RosterEmployee[] = demoStore.getEmployees().map((e: any) => ({
      employee_id: e.employee_id,
      fullname: e.fullname,
      username: e.username,
      role: e.role || 'Teller',
      email: e.email,
      contact_no: e.contact_no,
      joined_date: e.joined_date || new Date().toISOString().slice(0, 10),
      transactions_handled: e.transactions_handled || 0,
      status: e.status === 'Inactive' ? 'Inactive' : 'Active'
    }));
    this.employees = [...added, ...DEMO_EMPLOYEES.map(e => ({ ...e }))];
  }

  get filteredEmployees(): RosterEmployee[] {
    const q = this.searchTerm.trim().toLowerCase();
    return this.employees.filter(e => {
      const matchesRole = this.roleFilter === 'all' || e.role === this.roleFilter;
      const matchesSearch = !q || [e.fullname, e.employee_id, e.username, e.email, e.role].join(' ').toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }

  get totalCount(): number { return this.employees.length; }
  get activeCount(): number { return this.employees.filter(e => e.status === 'Active').length; }
  get inactiveCount(): number { return this.employees.filter(e => e.status === 'Inactive').length; }
  get totalTransactions(): number { return this.employees.reduce((s, e) => s + Number(e.transactions_handled || 0), 0); }

  roleCount(role: string): number {
    return this.employees.filter(e => e.role === role).length;
  }

  initials(name: string): string {
    return (name || '').split(' ').map(p => p.charAt(0)).join('').slice(0, 2).toUpperCase();
  }

  roleTone(role: string): string {
    switch (role) {
      case 'Loan Officer': return 'bg-gradient-to-r from-glass-amber/80 to-glass-orange/80';
      case 'Customer Service Officer': return 'bg-gradient-to-r from-glass-cyan/80 to-glass-blue/80';
      case 'Operations Officer': return 'bg-gradient-to-r from-glass-purple/80 to-glass-pink/80';
      default: return 'bg-gradient-to-r from-glass-emerald/80 to-glass-cyan/80';
    }
  }

  toggleStatus(employee: RosterEmployee): void {
    const turningOff = employee.status === 'Active';
    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      icon: turningOff ? 'warning' : 'question',
      title: turningOff ? 'Deactivate employee?' : 'Reactivate employee?',
      html: `<strong>${employee.fullname}</strong> (${employee.employee_id})<br>${turningOff ? 'They will lose dashboard access until reactivated.' : 'They will regain dashboard access.'}`,
      showCancelButton: true,
      confirmButtonText: turningOff ? 'Deactivate' : 'Reactivate',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (!result.isConfirmed) return;
      employee.status = turningOff ? 'Inactive' : 'Active';
      Swal.fire({
        icon: 'success',
        title: turningOff ? 'Employee deactivated' : 'Employee reactivated',
        timer: 1400,
        showConfirmButton: false
      });
    });
  }

  viewEmployee(employee: RosterEmployee): void {
    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      title: employee.fullname,
      html: `
        <div class="demo-detail-grid">
          <div class="demo-detail-row"><span>Employee ID</span><strong>${employee.employee_id}</strong></div>
          <div class="demo-detail-row"><span>Username</span><strong>@${employee.username}</strong></div>
          <div class="demo-detail-row"><span>Role</span><strong>${employee.role}</strong></div>
          <div class="demo-detail-row"><span>Email</span><strong>${employee.email}</strong></div>
          <div class="demo-detail-row"><span>Contact</span><strong>${employee.contact_no}</strong></div>
          <div class="demo-detail-row"><span>Joined</span><strong>${employee.joined_date}</strong></div>
          <div class="demo-detail-row"><span>Transactions handled</span><strong>${Number(employee.transactions_handled).toLocaleString()}</strong></div>
          <div class="demo-detail-row"><span>Status</span><strong>${employee.status}</strong></div>
        </div>
      `,
      confirmButtonText: 'Close'
    });
  }
}
