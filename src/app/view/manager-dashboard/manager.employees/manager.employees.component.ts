import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import Swal from 'sweetalert2';
import { DEMO_EMPLOYEES } from 'src/app/shared/demo-banking-fixtures';
import { demoStore } from 'src/app/shared/demo-store';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

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
export class ManagerEmployeesComponent implements AfterViewInit, OnDestroy {
  searchTerm = '';
  roleFilter = 'all';
  employees: RosterEmployee[] = [];
  private performanceChart: Chart | null = null;

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
      case 'Loan Officer': return 'bg-gradient-to-r from-amber-400/80 to-orange-500/80';
      case 'Customer Service Officer': return 'bg-gradient-to-r from-glass-cyan/80 to-glass-blue/80';
      case 'Operations Officer': return 'bg-gradient-to-r from-glass-purple/80 to-glass-pink/80';
      default: return 'bg-gradient-to-r from-glass-emerald/80 to-glass-cyan/80';
    }
  }

  ngAfterViewInit(): void {
    this.renderPerformanceChart();
  }

  ngOnDestroy(): void {
    this.performanceChart?.destroy();
  }

  private roleColor(role: string): string {
    switch (role) {
      case 'Loan Officer': return 'rgba(251,191,36,0.80)';
      case 'Customer Service Officer': return 'rgba(34,211,238,0.80)';
      case 'Operations Officer': return 'rgba(167,139,250,0.80)';
      default: return 'rgba(52,211,153,0.80)';
    }
  }

  private renderPerformanceChart(): void {
    const canvas = document.getElementById('employeePerformanceChart') as HTMLCanvasElement | null;
    if (!canvas) return;
    const sorted = [...this.employees]
      .filter(e => e.status === 'Active')
      .sort((a, b) => b.transactions_handled - a.transactions_handled)
      .slice(0, 8);

    const isLight = !document.documentElement.classList.contains('dark');
    const gridColor = isLight ? 'rgba(15,23,42,0.07)' : 'rgba(148,163,184,0.10)';
    const tickColor = isLight ? '#475569' : '#94a3b8';

    this.performanceChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: sorted.map(e => e.fullname.split(' ')[0]),
        datasets: [{
          data: sorted.map(e => e.transactions_handled),
          backgroundColor: sorted.map(e => this.roleColor(e.role)),
          borderColor: sorted.map(e => this.roleColor(e.role).replace('0.80', '1')),
          borderWidth: 1.5,
          borderRadius: 8,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const emp = sorted[ctx.dataIndex];
                return ` ${Number(ctx.parsed.x).toLocaleString()} txns · ${emp.role}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: tickColor, font: { size: 11 }, callback: v => Number(v).toLocaleString() },
          },
          y: { grid: { display: false }, ticks: { color: tickColor, font: { size: 11 } } },
        },
      },
    });
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
