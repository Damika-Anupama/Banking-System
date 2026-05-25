import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { FilterPipe } from 'src/app/pipes/filter.pipe';
import { UserService } from 'src/app/service/customer/user.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { DEMO_TRANSACTIONS } from 'src/app/shared/demo-banking-fixtures';
Chart.register(...registerables);

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit, OnDestroy {
  username = '';
  userType = '';
  accounts: any[] | null = null;
  balance = '';
  accountNumber = '';
  selectedAccount: any = null;
  searchTerm = '';
  isLoading = false;
  errorMessage = '';
  private subscriptions: Subscription[] = [];
  private chartInstance: Chart | null = null;

  get accountCount(): number {
    return this.accounts?.length || 0;
  }

  get totalBalance(): number {
    return (this.accounts || []).reduce((sum, account) => sum + this.amountOf(account), 0);
  }

  get filteredAccounts(): any[] {
    const accounts = this.accounts || [];
    const query = this.searchTerm.trim().toLowerCase();

    if (!query) {
      return accounts;
    }

    return accounts.filter(account => [
      account.account_id,
      account.account_type,
      account.saving_type,
      account.branch_name,
      account.amount
    ].some(value => String(value || '').toLowerCase().includes(query)));
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

  get incomeWidth(): number {
    return this.progressWidth(this.monthlyIncome);
  }

  get paymentWidth(): number {
    return this.progressWidth(this.monthlyPayments);
  }

  constructor(private router: Router, private userService: UserService) {}

  ngOnInit() {
    this.loadDashboardData();
    this.initializeChart();
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
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.errorMessage
          });
          return;
        }

        // Check if user[0] exists and has required properties
        if (!user[0] || !user[0]['user_id']) {
          this.errorMessage = 'Invalid user data format';
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.errorMessage
          });
          return;
        }

        try {
          localStorage.setItem('userId', user[0]['user_id']);
          this.username = user[0]['username'] || 'Unknown User';

          // Check if accounts exist
          if (!user[0]['accounts'] || !Array.isArray(user[0]['accounts']) || user[0]['accounts'].length === 0) {
            this.errorMessage = 'No accounts available';
            this.accounts = [];
            this.balance = '0';
            this.accountNumber = 'N/A';
            this.selectedAccount = null;
            this.isLoading = false;
            Swal.fire({
              icon: 'warning',
              title: 'No Accounts',
              text: 'You do not have any accounts yet.'
            });
          } else {
            this.accounts = user[0]['accounts'];

            // Safe access to first account
            if (this.accounts[0]) {
              this.balance = this.accounts[0]['amount'] || '0';
              this.accountNumber = this.accounts[0]['account_id'] || 'N/A';
              this.selectedAccount = this.accounts[0];
            }
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
        } catch (error) {
          console.error('Error processing dashboard data:', error);
          this.errorMessage = 'Failed to process user data';
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.errorMessage
          });
        }
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load dashboard data';
        this.isLoading = false;

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.errorMessage
        });
      }
    });

    this.subscriptions.push(sub);
  }

  initializeChart() {
    try {
      const canvas = document.getElementById('lineChart') as HTMLCanvasElement;
      if (!canvas) {
        console.warn('Chart canvas not found');
        return;
      }

      this.chartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: [
            'August',
            'September',
            'October',
            'November',
            'December',
            'January',
          ],
          datasets: [
            {
              label: 'Monthly Expenses',
              data: [12, 19, 3, 5, 2, 3],
              backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)',
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error initializing chart:', error);
      // Don't show error to user as chart is not critical
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
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());

    // Destroy chart instance
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }
}

