import { Component, OnInit, OnDestroy } from '@angular/core';
import { ManagerHomeService } from 'src/app/service/manager/manager.home.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-manager.home',
  standalone: false,
  templateUrl: './manager.home.component.html',
  styleUrls: ['./manager.home.component.scss'],
})
export class ManagerHomeComponent implements OnInit, OnDestroy {
  branch_id: any = null;
  branch_name = '';
  manager_id: any = null;
  num_accounts: any = 0;
  num_employees: any = 0;
  transactions: any = null;
  withdrawals: any = null;
  loans: any = null;
  transactionSearch = '';
  isLoading = false;
  errorMessage = '';
  private subscriptions: Subscription[] = [];

  get filteredTransactions(): any[] {
    const list = this.transactions || [];
    const q = this.transactionSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((t: any) =>
      [t.transfer_id, t.from_account, t.to_account, String(t.amount)]
        .some(v => v && String(v).toLowerCase().includes(q))
    );
  }

  constructor(private managerService: ManagerHomeService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const sub = this.managerService.getDashboardBlockDetails().subscribe({
      next: (response) => {
        try {
          // Null/undefined checks
          if (!response || !response['data']) {
            this.errorMessage = 'No data received from server';
            this.isLoading = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: this.errorMessage
            });
            return;
          }

          const user = response['data'];

          // Check if user array exists and has data
          if (!Array.isArray(user) || user.length === 0) {
            this.errorMessage = 'Invalid user data format';
            this.isLoading = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: this.errorMessage
            });
            return;
          }

          // Check if required fields exist
          if (!user[0] || !user[0]['user_id'] || !user[0]['branch_id']) {
            this.errorMessage = 'Missing required user information';
            this.isLoading = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: this.errorMessage
            });
            return;
          }

          // Store user data with null checks
          localStorage.setItem('userId', user[0]['user_id']);
          localStorage.setItem('branchId', user[0]['branch_id']);
          this.branch_id = user[0]['branch_id'];
          this.branch_name = user[0]['branch_name'] || 'Unknown Branch';
          this.manager_id = user[0]['manager_id'] || null;
          this.num_accounts = user[0]['num_accounts'] || 0;
          this.num_employees = user[0]['num_employees'] || 0;

          // Load additional data
          this.loadTransactions();
          this.loadWithdrawals();
          this.loadLateLoans();

          this.isLoading = false;
        } catch (error) {
          console.error('Error processing dashboard data:', error);
          this.errorMessage = 'Failed to process dashboard data';
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

  loadTransactions(): void {
    if (!this.branch_id) {
      console.warn('Branch ID not available for loading transactions');
      return;
    }

    const sub = this.managerService.getTotalTransactions(this.branch_id).subscribe({
      next: (transactions) => {
        // Null/undefined check
        if (!transactions) {
          console.warn('No transactions data received');
          this.transactions = null;
          return;
        }

        this.transactions = transactions.result || null;
      },
      error: (err) => {
        console.error('Error loading transactions:', err);
        this.transactions = null;
        // Don't show error to user as this is secondary data
      }
    });

    this.subscriptions.push(sub);
  }

  loadWithdrawals(): void {
    if (!this.branch_id) {
      console.warn('Branch ID not available for loading withdrawals');
      return;
    }

    const sub = this.managerService.getTotalWithdrawals(this.branch_id).subscribe({
      next: (withdrawals) => {
        // Null/undefined check
        if (!withdrawals) {
          console.warn('No withdrawals data received');
          this.withdrawals = null;
          return;
        }

        this.withdrawals = withdrawals;
      },
      error: (err) => {
        console.error('Error loading withdrawals:', err);
        this.withdrawals = null;
        // Don't show error to user as this is secondary data
      }
    });

    this.subscriptions.push(sub);
  }

  loadLateLoans(): void {
    if (!this.branch_id) {
      console.warn('Branch ID not available for loading late loans');
      return;
    }

    const sub = this.managerService.getLateLoans(this.branch_id).subscribe({
      next: (loans) => {
        // Null/undefined check
        if (!loans) {
          console.warn('No late loans data received');
          this.loans = null;
          return;
        }

        this.loans = loans;
      },
      error: (err) => {
        console.error('Error loading late loans:', err);
        this.loans = null;
        // Don't show error to user as this is secondary data
      }
    });

    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
