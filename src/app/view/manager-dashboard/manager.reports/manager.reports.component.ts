import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../../service/theme.service';
Chart.register(...registerables);

interface DayFlow {
  label: string;
  deposits: number;
  withdrawals: number;
}

interface Segment {
  label: string;
  value: number;
  tone: string;
  color: string;
}

@Component({
  selector: 'app-manager.reports',
  standalone: false,
  templateUrl: './manager.reports.component.html',
  styleUrls: ['./manager.reports.component.scss']
})
export class ManagerReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  period: '7d' | '30d' | 'qtr' = '7d';

  private loanChart: Chart | null = null;
  private mixChart: Chart | null = null;
  private themeSub: Subscription | null = null;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Chart colours are computed at render time, so a theme toggle must
    // rebuild the charts or the axis/legend colours stay in the old theme.
    this.themeSub = this.themeService.isDarkMode$.subscribe(() =>
      setTimeout(() => this.rerenderCharts())
    );
  }

  private rerenderCharts(): void {
    this.loanChart?.destroy();
    this.mixChart?.destroy();
    this.loanChart = null;
    this.mixChart = null;
    this.renderLoanChart();
    this.renderMixChart();
  }

  readonly cashFlow: DayFlow[] = [
    { label: 'Mon', deposits: 820000,  withdrawals: 540000 },
    { label: 'Tue', deposits: 1240000, withdrawals: 610000 },
    { label: 'Wed', deposits: 980000,  withdrawals: 720000 },
    { label: 'Thu', deposits: 1510000, withdrawals: 880000 },
    { label: 'Fri', deposits: 1820000, withdrawals: 1120000 },
    { label: 'Sat', deposits: 760000,  withdrawals: 430000 },
    { label: 'Sun', deposits: 410000,  withdrawals: 260000 }
  ];

  readonly loanPortfolio: Segment[] = [
    { label: 'Personal', value: 8400000,  tone: 'bg-glass-purple',  color: '#a78bfa' },
    { label: 'Business', value: 12600000, tone: 'bg-glass-cyan',    color: '#22d3ee' },
    { label: 'Mortgage', value: 5200000,  tone: 'bg-glass-emerald', color: '#34d399' },
    { label: 'Vehicle',  value: 3100000,  tone: 'bg-glass-orange',  color: '#fb923c' }
  ];

  readonly productMix: Segment[] = [
    { label: 'Savings',        value: 642, tone: 'bg-glass-emerald', color: '#34d399' },
    { label: 'Current',        value: 318, tone: 'bg-glass-cyan',    color: '#22d3ee' },
    { label: 'Fixed deposits', value: 214, tone: 'bg-glass-purple',  color: '#a78bfa' },
    { label: 'Cards',          value: 487, tone: 'bg-glass-orange',  color: '#fb923c' }
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

  ngAfterViewInit(): void {
    this.renderLoanChart();
    this.renderMixChart();
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
    this.loanChart?.destroy();
    this.mixChart?.destroy();
  }

  private chartDefaults() {
    const isLight = !document.documentElement.classList.contains('dark');
    return {
      legendColor: isLight ? '#475569' : '#cbd5e1',
      border: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(15,23,42,0.6)',
    };
  }

  private renderLoanChart(): void {
    const canvas = document.getElementById('loanPortfolioChart') as HTMLCanvasElement | null;
    if (!canvas) return;
    const { legendColor, border } = this.chartDefaults();
    this.loanChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: this.loanPortfolio.map(s => s.label),
        datasets: [{
          data: this.loanPortfolio.map(s => s.value),
          backgroundColor: this.loanPortfolio.map(s => s.color),
          borderColor: border,
          borderWidth: 3,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: legendColor, boxWidth: 12, padding: 14, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: ctx => ` Rs. ${Number(ctx.parsed).toLocaleString()} · ${this.segmentPct(this.loanPortfolio[ctx.dataIndex], this.loanPortfolio)}%`,
            },
          },
        },
      },
    });
  }

  private renderMixChart(): void {
    const canvas = document.getElementById('productMixChart') as HTMLCanvasElement | null;
    if (!canvas) return;
    const { legendColor, border } = this.chartDefaults();
    this.mixChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: this.productMix.map(s => s.label),
        datasets: [{
          data: this.productMix.map(s => s.value),
          backgroundColor: this.productMix.map(s => s.color),
          borderColor: border,
          borderWidth: 3,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: legendColor, boxWidth: 12, padding: 14, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.parsed} holders · ${this.segmentPct(this.productMix[ctx.dataIndex], this.productMix)}%`,
            },
          },
        },
      },
    });
  }
}
