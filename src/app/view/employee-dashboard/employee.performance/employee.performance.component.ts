import { Component } from '@angular/core';

interface Target {
  label: string;
  done: number;
  goal: number;
  tone: string;
}

interface ActivityRow {
  label: string;
  count: number;
  icon: string;
}

@Component({
  selector: 'app-employee.performance',
  standalone: false,
  templateUrl: './employee.performance.component.html',
  styleUrls: ['./employee.performance.component.scss']
})
export class EmployeePerformanceComponent {
  today = new Date();

  // Headline stats for the day.
  transactionsToday = 38;
  depositsHandled = 16;
  withdrawalsHandled = 14;
  ticketsResolved = 5;
  avgHandleMinutes = 4.2;
  customerRating = 4.8;

  targets: Target[] = [
    { label: 'Transactions processed', done: 38, goal: 50, tone: 'bg-cyan-400' },
    { label: 'New accounts opened',    done: 3,  goal: 5,  tone: 'bg-emerald-400' },
    { label: 'Service tickets closed', done: 5,  goal: 8,  tone: 'bg-violet-400' },
    { label: 'Loan applications taken', done: 2, goal: 3,  tone: 'bg-amber-400' }
  ];

  activity: ActivityRow[] = [
    { label: 'Cash deposits',    count: 16, icon: 'fa-money-bill-trend-up' },
    { label: 'Cash withdrawals', count: 14, icon: 'fa-money-bill-wave' },
    { label: 'Account opening',  count: 3,  icon: 'fa-folder-plus' },
    { label: 'Customer lookups', count: 21, icon: 'fa-user-magnifying-glass' },
    { label: 'Service tickets',  count: 5,  icon: 'fa-headset' }
  ];

  // Last 6 working days throughput for the mini trend.
  weeklyTrend = [
    { label: 'Mon', value: 42 },
    { label: 'Tue', value: 51 },
    { label: 'Wed', value: 47 },
    { label: 'Thu', value: 58 },
    { label: 'Fri', value: 63 },
    { label: 'Today', value: 38 }
  ];

  get maxTrend(): number {
    return Math.max(...this.weeklyTrend.map(d => d.value), 1);
  }

  pct(target: Target): number {
    return Math.min(100, Math.round((target.done / target.goal) * 100));
  }

  trendHeight(value: number): number {
    return Math.round((value / this.maxTrend) * 100);
  }

  get overallProgress(): number {
    const done = this.targets.reduce((s, t) => s + t.done, 0);
    const goal = this.targets.reduce((s, t) => s + t.goal, 0);
    return goal ? Math.round((done / goal) * 100) : 0;
  }
}
