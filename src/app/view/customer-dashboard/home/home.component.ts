import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { FilterPipe } from 'src/app/pipes/filter.pipe';
import { UserService } from 'src/app/service/customer/user.service';
import { ThemeService } from 'src/app/service/theme.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';
import { TableSort } from 'src/app/shared/table-sort';
import { DEMO_TRANSACTIONS } from 'src/app/shared/demo-banking-fixtures';
import { readStorage, writeStorage } from 'src/app/shared/safe-storage';
Chart.register(...registerables);

const SPENDING_COLORS = ['#22d3ee', '#3b82f6', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#fb7185', '#94a3b8'];

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  username = '';
  userType = '';
  accounts: any[] | null = null;
  balance = '';
  accountNumber = '';
  selectedAccount: any = null;
  private _searchTerm = '';
  isLoading = false;
  errorMessage = '';
  /** Mirrors the linked-accounts table headers so the skeleton holds its shape. */
  readonly accountSkeletonColumns = ['Account', 'Product', 'Branch', 'Status', 'Balance'];
  private subscriptions: Subscription[] = [];
  private chartInstance: Chart | null = null;

  fdCalcPrincipal = 100000;
  fdCalcMonths = 12;

  get fdCalcRate(): number {
    if (this.fdCalcMonths <= 3) return 6.5;
    if (this.fdCalcMonths <= 6) return 7.75;
    if (this.fdCalcMonths <= 12) return 9.5;
    return 10.25;
  }

  get fdCalcInterest(): number {
    const p = Math.max(0, Number(this.fdCalcPrincipal) || 0);
    return Math.round(p * this.fdCalcRate * this.fdCalcMonths / 12 / 100);
  }

  get fdCalcMaturity(): number {
    return Math.max(0, Number(this.fdCalcPrincipal) || 0) + this.fdCalcInterest;
  }

  get accountCount(): number {
    return this.accounts?.length || 0;
  }

  get totalBalance(): number {
    return (this.accounts || []).reduce((sum, account) => sum + this.amountOf(account), 0);
  }

  get searchTerm(): string {
    return this._searchTerm;
  }

  set searchTerm(value: string) {
    this._searchTerm = value;
    // A new search invalidates the current page position.
    this.accountPage = 1;
  }

  /** Column sorting for the linked-accounts table, same cycle as the ledger. */
  readonly accountSort = new TableSort<any>({
    product: account => String(account?.saving_type || '').toLowerCase(),
    branch: account => String(account?.branch_name || '').toLowerCase(),
    balance: account => this.amountOf(account),
  });

  /** Toggles a column sort and returns the table to its first page. */
  toggleAccountSort(column: string): void {
    this.accountSort.toggle(column);
    this.accountPage = 1;
  }

  get filteredAccounts(): any[] {
    const accounts = this.accounts || [];
    const query = this.searchTerm.trim().toLowerCase();

    if (!query) {
      return this.accountSort.apply(accounts);
    }

    return this.accountSort.apply(accounts.filter(account => [
      account.account_id,
      account.account_type,
      account.saving_type,
      account.branch_name,
      account.amount
    ].some(value => String(value || '').toLowerCase().includes(query))));
  }

  accountPage = 1;
  readonly accountPageSize = 5;

  get filteredAccountCount(): number {
    return this.filteredAccounts.length;
  }

  get totalAccountPages(): number {
    return Math.max(1, Math.ceil(this.filteredAccountCount / this.accountPageSize));
  }

  get pagedAccounts(): any[] {
    const page = Math.min(this.accountPage, this.totalAccountPages);
    const start = (page - 1) * this.accountPageSize;
    return this.filteredAccounts.slice(start, start + this.accountPageSize);
  }

  get accountRangeStart(): number {
    return this.filteredAccountCount === 0 ? 0 : (Math.min(this.accountPage, this.totalAccountPages) - 1) * this.accountPageSize + 1;
  }

  get accountRangeEnd(): number {
    return Math.min(this.accountRangeStart + this.accountPageSize - 1, this.filteredAccountCount);
  }

  setAccountPage(page: number): void {
    this.accountPage = Math.max(1, Math.min(page, this.totalAccountPages));
  }

  get selectedSavingLabel(): string {
    return this.formatSavingType(this.selectedAccount?.saving_type);
  }

  get selectedAccountTypeLabel(): string {
    return this.formatAccountType(this.selectedAccount?.account_type);
  }

  get selectedBranch(): string {
    return this.selectedAccount?.branch_name || 'No branch selected';
  }

  get maskedAccountNumber(): string {
    return this.maskAccountId(this.accountNumber);
  }

  get selectedAccountTransactions(): any[] {
    return DEMO_TRANSACTIONS[this.accountNumber] || [];
  }

  get monthlyIncome(): number {
    return this.selectedAccountTransactions
      .filter(transaction => transaction.status === 'up')
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  }

  get monthlyPayments(): number {
    return this.selectedAccountTransactions
      .filter(transaction => transaction.status === 'down')
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  }

  get savingsRate(): number {
    const income = this.monthlyIncome;
    return income > 0 ? Math.max(0, Math.round(((income - this.monthlyPayments) / income) * 100)) : 0;
  }

  get moneyMovementUpdatedAt(): Date | null {
    const latest = this.selectedAccountTransactions
      .map(transaction => new Date(transaction.date).getTime())
      .filter(timestamp => Number.isFinite(timestamp))
      .sort((a, b) => b - a)[0];
    return latest ? new Date(latest) : null;
  }

  get movementTxnCount(): number {
    return this.selectedAccountTransactions.length;
  }

  /** Actual date span covered by the selected account's sample transactions. */
  get movementPeriodLabel(): string {
    const times = this.selectedAccountTransactions
      .map(transaction => new Date(transaction.date).getTime())
      .filter(timestamp => Number.isFinite(timestamp))
      .sort((a, b) => a - b);
    if (times.length === 0) return 'No recent activity';
    const fmt = (ms: number) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const from = fmt(times[0]);
    const to = fmt(times[times.length - 1]);
    return from === to ? from : `${from} – ${to}`;
  }

  get netMovement(): number {
    return this.monthlyIncome - this.monthlyPayments;
  }

  /** Five most recent transactions for the selected account. */
  get recentTransactions(): any[] {
    return [...this.selectedAccountTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }

  get incomeWidth(): number {
    return this.progressWidth(this.monthlyIncome);
  }

  get paymentWidth(): number {
    return this.progressWidth(this.monthlyPayments);
  }

  /** Outgoing transactions grouped by type, for the spending breakdown chart. */
  get spendingByCategory(): { label: string; value: number }[] {
    const totals = new Map<string, number>();
    for (const txn of this.selectedAccountTransactions) {
      if (txn.status !== 'down') continue;
      const label = String(txn.type || 'Other');
      totals.set(label, (totals.get(label) || 0) + Number(txn.amount || 0));
    }
    return Array.from(totals.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }

  constructor(private router: Router, private userService: UserService, private themeService: ThemeService, private toastService: ToastService) {}

  ngOnInit() {
    this.loadDashboardData();
    // Re-render the chart when the theme changes so legend/segment colours stay readable.
    this.subscriptions.push(
      this.themeService.isDarkMode$.subscribe(() => setTimeout(() => this.renderSpendingChart()))
    );
  }

  ngAfterViewInit(): void {
    this.renderSpendingChart();
  }

  loadDashboardData() {
    this.isLoading = true;
    this.errorMessage = '';

    const sub = this.userService.getDashboardDetails().subscribe({
      next: (user) => {
        // Null/undefined checks
        if (!user || !Array.isArray(user) || user.length === 0) {
          this.errorMessage = 'No user data available';
          this.isLoading = false;
          this.toastService.error('Could not load accounts', this.errorMessage);
          return;
        }

        // Check if user[0] exists and has required properties
        if (!user[0] || !user[0]['user_id']) {
          this.errorMessage = 'Invalid user data format';
          this.isLoading = false;
          this.toastService.error('Could not load accounts', this.errorMessage);
          return;
        }

        try {
          writeStorage('userId', user[0]['user_id']);
          this.username = user[0]['username'] || 'Unknown User';

          // Check if accounts exist
          if (!user[0]['accounts'] || !Array.isArray(user[0]['accounts']) || user[0]['accounts'].length === 0) {
            this.errorMessage = 'No accounts available';
            this.accounts = [];
            this.balance = '0';
            this.accountNumber = 'N/A';
            this.selectedAccount = null;
            this.isLoading = false;
          } else {
            this.accounts = user[0]['accounts'];

            // Safe access to first account
            if (this.accounts[0]) {
              this.balance = this.accounts[0]['amount'] || '0';
              this.accountNumber = this.accounts[0]['account_id'] || 'N/A';
              this.selectedAccount = this.accounts[0];
            }

            // Re-select the account the customer last viewed, if it still exists.
            this.restoreSelectedAccount();
          }

          // Set user type with null check
          switch (user[0]['type']) {
            case 'CUSTOMER':
              this.userType = 'Customer';
              break;
            case 'EMPLOYEE':
              this.userType = 'Employee';
              break;
            case 'ADMIN':
              this.userType = 'Admin';
              break;
            default:
              this.userType = 'Unknown';
          }

          this.isLoading = false;
          // Render the spending breakdown once the initial account is loaded.
          setTimeout(() => this.renderSpendingChart());
        } catch (error) {
          console.error('Error processing dashboard data:', error);
          this.errorMessage = 'Failed to process user data';
          this.isLoading = false;
          this.toastService.error('Could not load accounts', this.errorMessage);
        }
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load dashboard data';
        this.isLoading = false;

        this.toastService.error('Could not load accounts', this.errorMessage);
      }
    });

    this.subscriptions.push(sub);
  }

  /** Renders (or re-renders) the spending-by-category doughnut from real transaction data. */
  renderSpendingChart(): void {
    try {
      const canvas = document.getElementById('spendingChart') as HTMLCanvasElement | null;
      if (!canvas) return;

      const breakdown = this.spendingByCategory;
      this.chartInstance?.destroy();

      if (breakdown.length === 0) {
        this.chartInstance = null;
        return;
      }

      const isLight = !document.documentElement.classList.contains('dark');
      const legendColor = isLight ? '#475569' : '#cbd5e1';
      const segmentBorder = isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.6)';

      this.chartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: breakdown.map(item => item.label),
          datasets: [{
            data: breakdown.map(item => item.value),
            backgroundColor: breakdown.map((_, i) => SPENDING_COLORS[i % SPENDING_COLORS.length]),
            borderColor: segmentBorder,
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: legendColor, boxWidth: 12, padding: 12, font: { size: 11 } },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: Rs. ${Number(ctx.parsed).toLocaleString()}`,
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('Error rendering spending chart:', error);
    }
  }

  amountOf(account: any): number {
    const amount = Number(account?.amount || 0);
    return Number.isFinite(amount) ? amount : 0;
  }

  formatSavingType(value: string | null | undefined): string {
    return value === 'CURRENT' ? 'Current' : value === 'SAVING' ? 'Saving' : 'Account';
  }

  formatAccountType(value: string | null | undefined): string {
    return value === 'ORGANIZATION' ? 'Organization' : value === 'PERSONAL' ? 'Personal' : 'Customer';
  }

  maskAccountId(value: string | number | null | undefined): string {
    const accountId = String(value || 'N/A');
    if (accountId === 'N/A' || accountId.length <= 4) {
      return accountId;
    }

    return `${'*'.repeat(Math.max(accountId.length - 4, 0))}${accountId.slice(-4)}`;
  }

  accountStatus(account: any): string {
    return account === this.selectedAccount ? 'Selected' : 'Active';
  }

  trackByAccountId(_index: number, account: any): string {
    return String(account?.account_id || _index);
  }

  progressWidth(value: number): number {
    const baseline = Math.max(this.monthlyIncome, this.monthlyPayments, 1);
    return Math.max(8, Math.min(100, Math.round((value / baseline) * 100)));
  }

  updateSmallBox(account: any) {
    // Null check for account
    if (!account) {
      console.error('Invalid account selected');
      return;
    }

    // Update the balance value with null check
    this.balance = account.amount || '0';
    // Update the account number value with null check
    this.accountNumber = account.account_id || 'N/A';
    this.selectedAccount = account;

    // Remember this choice so the dashboard reopens on the same account.
    try {
      writeStorage('lastSelectedAccountId', String(account.account_id));
    } catch {
      // Ignore storage failures (private mode / quota).
    }

    // Refresh the spending breakdown for the newly selected account.
    setTimeout(() => this.renderSpendingChart());
  }

  /** Restore the customer's last-viewed account when it is still in the list. */
  private restoreSelectedAccount(): void {
    const savedId = readStorage('lastSelectedAccountId');
    if (!savedId) return;
    const match = (this.accounts || []).find(a => String(a?.account_id) === savedId);
    if (match) {
      this.selectedAccount = match;
      this.balance = match.amount || '0';
      this.accountNumber = match.account_id || 'N/A';
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());

    // Destroy chart instance
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }
}

