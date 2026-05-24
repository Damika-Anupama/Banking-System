import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { TransactionService } from 'src/app/service/customer/transaction.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-transaction',
  standalone: false,
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.scss']
})
export class TransactionComponent implements OnInit, OnDestroy {
  account_id = '';
  balance = '';
  account_type = '';
  saving_type = '';
  branch = '';
  accounts: any[] | null = null;
  selectedAccount: any = null;
  transactions: any[] | null = null;
  cumulativeBalance: any = null;

  transfer_amount = '';
  sender_remarks = '';
  beneficiary_remarks = '';
  to_account = '';

  isLoading = false;
  isLoadingTransactions = false;
  isProcessingTransaction = false;
  errorMessage = '';
  private subscriptions: Subscription[] = [];

  constructor(private router: Router, private transactionService: TransactionService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadAccountDetails();
  }

  loadAccountDetails() {
    this.isLoading = true;
    this.errorMessage = '';

    const sub = this.transactionService.getAccountDetails().subscribe({
      next: (data) => {
        // Null/undefined checks
        if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
          this.errorMessage = 'No account data available';
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.errorMessage
          });
          return;
        }

        try {
          this.accounts = data.data;

          // Safe access to first account
          if (data.data[0]) {
            this.account_id = data.data[0].account_id || '';
            this.cumulativeBalance = this.balance = data.data[0].amount || '0';
            this.account_type = data.data[0].account_type || 'N/A';
            this.saving_type = data.data[0].saving_type || 'N/A';
            this.branch = data.data[0].branch_name || 'N/A';
            this.selectedAccount = data.data[0];

            if (this.account_id) {
              this.loadDataToTable(this.account_id);
            }
          } else {
            this.errorMessage = 'No accounts found';
            Swal.fire({
              icon: 'warning',
              title: 'No Accounts',
              text: 'You do not have any accounts yet.'
            });
          }

          this.isLoading = false;
        } catch (error) {
          console.error('Error processing account data:', error);
          this.errorMessage = 'Failed to process account data';
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.errorMessage
          });
        }
      },
      error: (err) => {
        console.error('Error loading account details:', err);
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load account details';
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

  updateSmallBox(account: any) {
    // Null check for account
    if (!account) {
      console.error('Invalid account selected');
      return;
    }

    // Update the balance value with null check
    this.balance = account.amount || '0';
    // Update the account number value with null check
    this.account_id = account.account_id || '';
    this.selectedAccount = account;

    // Reload transactions for selected account
    if (this.account_id) {
      this.loadDataToTable(this.account_id);
    }
  }

  showToast(data: any) {
    if (!data) {
      Swal.fire({
        title: 'Error',
        text: 'Invalid response from server',
        icon: 'error'
      });
      return;
    }

    if (data.message == 'Transfer created successfully!') {
      Swal.fire({
        title: 'Success',
        text: data.message,
        icon: 'success'
      });
    } else {
      Swal.fire({
        title: 'Error',
        text: data.message || 'Transaction failed',
        icon: 'error'
      });
    }
  }

  proceedTransaction() {
    // Form validation
    if (!this.account_id || !this.to_account || !this.transfer_amount) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all required fields (Account, To Account, Amount)'
      });
      return;
    }

    // Validate amount is a positive number
    const amount = Number(this.transfer_amount);
    if (isNaN(amount) || amount <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter a valid positive amount'
      });
      return;
    }

    // Check sufficient balance
    const currentBalance = Number(this.balance);
    if (amount > currentBalance) {
      Swal.fire({
        icon: 'error',
        title: 'Insufficient Balance',
        text: 'Transfer amount exceeds available balance'
      });
      return;
    }

    // Check if transferring to same account
    if (this.account_id === this.to_account) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Transfer',
        text: 'Cannot transfer to the same account'
      });
      return;
    }

    this.isProcessingTransaction = true;
    this.errorMessage = '';

    const sub = this.transactionService.proceedTransaction(
      this.account_id,
      this.to_account,
      this.transfer_amount,
      this.sender_remarks,
      this.beneficiary_remarks
    ).subscribe({
      next: (data) => {
        try {
          // Update balance
          this.balance = String(Number(this.balance) - Number(this.transfer_amount));

          // Clear form
          this.transfer_amount = '';
          this.sender_remarks = '';
          this.beneficiary_remarks = '';
          this.to_account = '';

          this.isProcessingTransaction = false;
          this.showToast(data);

          // Reload transactions
          if (this.account_id) {
            this.loadDataToTable(this.account_id);
          }
        } catch (error) {
          console.error('Error processing transaction response:', error);
          this.isProcessingTransaction = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to process transaction response'
          });
        }
      },
      error: (err) => {
        console.error('Error processing transaction:', err);
        this.errorMessage = err?.error?.message || err?.message || 'Failed to process transaction';
        this.isProcessingTransaction = false;

        Swal.fire({
          icon: 'error',
          title: 'Transaction Failed',
          text: this.errorMessage
        });
      }
    });

    this.subscriptions.push(sub);
  }

  loadDataToTable(accountId: any) {
    // Validate accountId
    if (!accountId) {
      console.error('Invalid account ID');
      return;
    }

    this.isLoadingTransactions = true;

    const sub = this.transactionService.getTransactions(accountId).subscribe({
      next: (data) => {
        // Null/undefined checks
        if (!data || !data.data) {
          this.transactions = [];
          this.isLoadingTransactions = false;
          return;
        }

        this.transactions = Array.isArray(data.data) ? data.data : [];
        this.isLoadingTransactions = false;
      },
      error: (err) => {
        console.error('Error loading transactions:', err);
        this.transactions = [];
        this.isLoadingTransactions = false;

        // Don't show error popup for transactions load failure
        // Just log it to console
      }
    });

    this.subscriptions.push(sub);
  }

  showTransactionDetails(transaction: any): void {
    if (!transaction) {
      return;
    }

    Swal.fire({
      title: transaction.type || 'Transaction detail',
      html: `
        <div style="text-align:left;line-height:1.8">
          <strong>Date:</strong> ${transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}<br>
          <strong>Amount:</strong> Rs. ${Number(transaction.amount || 0).toLocaleString()}<br>
          <strong>Direction:</strong> ${transaction.status === 'up' ? 'Incoming' : 'Outgoing'}<br>
          <strong>Remarks:</strong> ${transaction.sender_remarks || 'No remarks'}
        </div>
      `,
      icon: transaction.status === 'up' ? 'success' : 'info',
      confirmButtonText: 'Close'
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
