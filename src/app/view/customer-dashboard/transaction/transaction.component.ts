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
  dailyTransferLimit = 500000;
  transferFee = 0;
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

  async proceedTransaction() {
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

    if (amount > this.dailyTransferLimit) {
      Swal.fire({
        icon: 'error',
        title: 'Daily Limit Exceeded',
        text: `Single demo transfers are limited to Rs. ${this.dailyTransferLimit.toLocaleString()}`
      });
      return;
    }

    if (!/^ACC-?\d{6,}$/.test(this.to_account.trim())) {
      Swal.fire({
        icon: 'error',
        title: 'Check beneficiary account',
        text: 'Use a valid account format such as ACC-492811 before continuing.'
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

    const reference = 'TRX-' + Date.now().toString().slice(-8);
    const confirmation = await Swal.fire({
      icon: 'question',
      title: 'Review transfer details',
      html: `
        <div style="text-align:left;line-height:1.8">
          <strong>Reference:</strong> ${reference}<br>
          <strong>From account:</strong> ${this.account_id}<br>
          <strong>To account:</strong> ${this.to_account}<br>
          <strong>Amount:</strong> Rs. ${amount.toLocaleString()}<br>
          <strong>Remarks:</strong> ${this.sender_remarks || 'Not provided'}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirm transfer',
      cancelButtonText: 'Review again'
    });

    if (!confirmation.isConfirmed) {
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
          const destinationAccount = this.to_account;
          // Update balance
          this.balance = String(Number(this.balance) - Number(this.transfer_amount));

          // Clear form
          this.transfer_amount = '';
          this.sender_remarks = '';
          this.beneficiary_remarks = '';
          this.to_account = '';

          this.isProcessingTransaction = false;
          Swal.fire({
            title: 'Transfer completed',
            html: `Reference <strong>${reference}</strong><br>Rs. ${amount.toLocaleString()} sent to ${destinationAccount}.`,
            icon: 'success',
            confirmButtonText: 'Done'
          });

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

  transactionReference(transaction: any, index: number = 0): string {
    const rawDate = transaction?.date ? new Date(transaction.date).getTime().toString().slice(-6) : '000000';
    return `TXN-${rawDate}-${String(index + 1).padStart(2, '0')}`;
  }

  downloadReceipt(transaction: any, index: number): void {
    const reference = this.transactionReference(transaction, index);
    Swal.fire({
      icon: 'info',
      title: 'Receipt ready',
      html: `Receipt <strong>${reference}</strong><br>Status: Posted<br>Amount: Rs. ${Number(transaction?.amount || 0).toLocaleString()}`,
      confirmButtonText: 'Close'
    });
  }

  showTransactionDetails(transaction: any): void {
    if (!transaction) {
      return;
    }

    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      title: this.transactionReference(transaction),
      html: `
        <div class="demo-detail-grid">
          <div class="demo-detail-row"><span>Type</span><strong>${transaction.type || 'Transaction'}</strong></div>
          <div class="demo-detail-row"><span>Date</span><strong>${transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}</strong></div>
          <div class="demo-detail-row"><span>Amount</span><strong>Rs. ${Number(transaction.amount || 0).toLocaleString()}</strong></div>
          <div class="demo-detail-row"><span>Direction</span><strong>${transaction.status === 'up' ? 'Incoming' : 'Outgoing'}</strong></div>
          <div class="demo-detail-row"><span>Remarks</span><strong>${transaction.sender_remarks || 'No remarks'}</strong></div>
          <div class="demo-detail-row"><span>Audit state</span><strong>Posted to ledger</strong></div>
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
