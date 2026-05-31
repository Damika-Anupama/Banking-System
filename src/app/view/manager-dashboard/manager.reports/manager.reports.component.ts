import { Component } from '@angular/core';

interface DayFlow {
  label: string;
  deposits: number;
  withdrawals: number;
}

interface Segment {
  label: string;
  value: number;
  tone: string;
}

@Component({
  selector: 'app-manager.reports',
  standalone: false,
  templateUrl: './manager.reports.component.html',
  styleUrls: ['./manager.reports.component.scss']
})
export class ManagerReportsComponent {
  period: '7d' | '30d' | 'qtr' = '7d';

  // Deposits vs withdrawals across the last 7 days.
  readonly cashFlow: DayFlow[] = [
    { label: 'Mon', deposits: 820000,  withdrawals: 540000 },
    { label: 'Tue', deposits: 1240000, withdrawals: 610000 },
    { label: 'Wed', deposits: 980000,  withdrawals: 720000 },
    { label: 'Thu', deposits: 1510000, withdrawals: 880000 },
    { label: 'Fri', deposits: 1820000, withdrawals: 1120000 },
    { label: 'Sat', deposits: 760000,  withdrawals: 430000 },
    { label: 'Sun', deposits: 410000,  withdrawals: 260000 }
  ];

  // Loan portfolio by product.
  readonly loanPortfolio: Segment[] = [
    { label: 'Personal', value: 8400000,  tone: 'bg-glass-purple' },
    { label: 'Business', value: 12600000, tone: 'bg-glass-cyan' },
    { label: 'Mortgage', value: 5200000,  tone: 'bg-glass-emerald' },
    { label: 'Vehicle',  value: 3100000,  tone: 'bg-glass-orange' }
  ];

  // Customer product mix (account holders by product).
  readonly productMix: Segment[] = [
    { label: 'Savings',        value: 642, tone: 'bg-glass-emerald' },
    { label: 'Current',        value: 318, tone: 'bg-glass-cyan' },
    { label: 'Fixed deposits', value: 214, tone: 'bg-glass-purple' },
    { label: 'Cards',          value: 487, tone: 'bg-glass-orange' }
  ];

  get totalDeposits(): number {
    return this.cashFlow.reduce((s, d) => s + d.deposits, 0);
  }
  get totalWithdrawals(): number {
    return this.cashFlow.reduce((s, d) => s + d.withdrawals, 0);
  }
  get netInflow(): number {
    return this.totalDeposits - this.totalWithdrawals;
  }
  get loanBookTotal(): number {
    return this.loanPortfolio.reduce((s, l) => s + l.value, 0);
  }
  get maxFlow(): number {
    return Math.max(...this.cashFlow.map(d => Math.max(d.deposits, d.withdrawals)), 1);
  }

  barHeight(value: number): number {
    return Math.round((value / this.maxFlow) * 100);
  }

  segmentPct(segment: Segment, segments: Segment[]): number {
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    return Math.round((segment.value / total) * 100);
  }
}
