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
  beneficiary_name = '';
  payment_category = 'Supplier / invoice';
  transfer_priority: 'Standard' | 'Instant' = 'Standard';
  schedule_date = new Date().toISOString().slice(0, 10);

  isLoading = false;
  isLoadingTransactions = false;
  isProcessingTransaction = false;
  dailyTransferLimit = 500000;
  transferFee = 0;
  errorMessage = '';
  transactionSearchTerm = '';
  transactionDirectionFilter: 'all' | 'in' | 'out' = 'all';
  transactionStatusFilter: 'all' | 'posted' | 'review' = 'all';
  transactionPage = 1;
  transactionPageSize = 6;
  readonly transactionPageSizes = [6, 10, 15];
  readonly paymentCategories = ['Supplier / invoice', 'Rent / lease', 'Family support', 'Utilities', 'Tax / government', 'Other'];
  private subscriptions: Subscription[] = [];

  get selectedSavingLabel(): string {
    return this.formatSavingType(this.selectedAccount?.saving_type || this.saving_type);
  }

  get selectedAccountTypeLabel(): string {
    return this.formatAccountType(this.selectedAccount?.account_type || this.account_type);
  }

  get selectedBranch(): string {
    return this.selectedAccount?.branch_name || this.branch || 'No branch selected';
  }

  get maskedAccountNumber(): string {
    return this.maskAccountId(this.account_id);
  }

  get availableBalance(): number {
    return this.amountOf({ amount: this.balance });
  }

  get transferAmountNumber(): number {
    const amount = Number(this.transfer_amount || 0);
    return Number.isFinite(amount) ? amount : 0;
  }

  get remainingLimit(): number {
    return Math.max(this.dailyTransferLimit - this.totalOutgoing, 0);
  }

  get transferReady(): boolean {
    return Boolean(this.account_id && this.to_account && this.transfer_amount && this.sender_remarks && this.beneficiary_remarks && !this.isProcessingTransaction);
  }

  get filteredTransactions(): any[] {
    const rows = this.transactions || [];
    const query = this.transactionSearchTerm.trim().toLowerCase();

    return rows.filter((transaction, index) => {
      const direction = this.transactionDirection(transaction);
      const matchesDirection = this.transactionDirectionFilter === 'all'
        || (this.transactionDirectionFilter === 'in' && direction === 'Incoming')
        || (this.transactionDirectionFilter === 'out' && direction === 'Outgoing');
      const matchesStatus = this.transactionStatusFilter === 'all' || this.transactionAuditState(transaction).toLowerCase().includes(this.transactionStatusFilter);
      const searchable = [
        this.transactionReference(transaction, index),
        transaction?.type,
        transaction?.channel,
        transaction?.sender_remarks,
        transaction?.beneficiary_remarks,
        transaction?.amount,
        transaction?.date,
        direction,
        this.transactionAuditState(transaction)
      ].join(' ').toLowerCase();

      return matchesDirection && matchesStatus && (!query || searchable.includes(query));
    });
  }


  get totalTransactionPages(): number {
    return Math.max(1, Math.ceil(this.filteredTransactions.length / this.transactionPageSize));
  }

  get paginatedTransactions(): any[] {
    const page = Math.min(this.transactionPage, this.totalTransactionPages);
    const start = (page - 1) * this.transactionPageSize;
    return this.filteredTransactions.slice(start, start + this.transactionPageSize);
  }

  get paginationStart(): number {
    return this.filteredTransactions.length === 0 ? 0 : ((Math.min(this.transactionPage, this.totalTransactionPages) - 1) * this.transactionPageSize) + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.paginationStart + this.transactionPageSize - 1, this.filteredTransactions.length);
  }

  get beneficiaryRiskLabel(): string {
    const value = this.to_account.trim().toUpperCase();
    if (!value) {
      return 'Awaiting beneficiary';
    }
    if (value === this.account_id) {
      return 'Same account blocked';
    }
    return /^ACC-?\d{6,}$/.test(value) ? 'Format verified' : 'Needs valid account number';
  }

  get transferReviewItems(): Array<{ label: string; value: string }> {
    return [
      { label: 'Source', value: this.maskAccountId(this.account_id) },
      { label: 'Beneficiary', value: this.beneficiary_name || 'Not named' },
      { label: 'Category', value: this.payment_category },
      { label: 'Priority', value: this.transfer_priority },
      { label: 'Schedule', value: this.schedule_date || 'Today' }
    ];
  }

  get totalIncoming(): number {
    return (this.transactions || [])
      .filter(transaction => this.transactionDirection(transaction) === 'Incoming')
      .reduce((sum, transaction) => sum + Number(transaction?.amount || 0), 0);
  }

  get totalOutgoing(): number {
    return (this.transactions || [])
      .filter(transaction => this.transactionDirection(transaction) === 'Outgoing')
      .reduce((sum, transaction) => sum + Number(transaction?.amount || 0), 0);
  }

  get netMovement(): number {
    return this.totalIncoming - this.totalOutgoing;
  }

  get latestTransactionDate(): Date | null {
    const latest = (this.transactions || [])
      .map(transaction => new Date(transaction?.date).getTime())
      .filter(timestamp => Number.isFinite(timestamp))
      .sort((a, b) => b - a)[0];
    return latest ? new Date(latest) : null;
  }

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
          this.accounts = [...data.data];

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

    const normalizedToAccount = this.to_account.trim().toUpperCase();
    this.to_account = normalizedToAccount;

    // Check if transferring to same account
    if (this.account_id === normalizedToAccount) {
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
          <strong>From account:</strong> ${this.account_id} (${this.selectedSavingLabel})<br>
          <strong>Beneficiary:</strong> ${this.beneficiary_name || 'Not provided'}<br>
          <strong>To account:</strong> ${normalizedToAccount}<br>
          <strong>Category:</strong> ${this.payment_category}<br>
          <strong>Priority:</strong> ${this.transfer_priority}<br>
          <strong>Schedule:</strong> ${this.schedule_date || 'Today'}<br>
          <strong>Amount:</strong> Rs. ${amount.toLocaleString()}<br>
          <strong>Fee:</strong> Rs. ${this.transferFee.toLocaleString()}<br>
          <strong>Purpose:</strong> ${this.sender_remarks || 'Not provided'}
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
          const newBalance = Number(this.balance) - Number(this.transfer_amount);
          this.balance = String(newBalance);
          if (this.selectedAccount) {
            this.selectedAccount.amount = String(newBalance);
          }
          this.accounts = (this.accounts || []).map(account => account.account_id === this.account_id ? { ...account, amount: String(newBalance) } : account);
          this.transactions = [
            {
              date: new Date().toISOString(),
              type: this.payment_category,
              sender_remarks: this.sender_remarks,
              beneficiary_remarks: this.beneficiary_remarks,
              beneficiary_name: this.beneficiary_name,
              channel: this.transfer_priority === 'Instant' ? 'Instant transfer' : 'Online banking',
              to_account: destinationAccount,
              amount,
              status: 'down',
              audit_status: 'Posted',
              reference
            },
            ...(this.transactions || [])
          ];

          // Clear form
          this.transfer_amount = '';
          this.sender_remarks = '';
          this.beneficiary_remarks = '';
          this.to_account = '';
          this.beneficiary_name = '';
          this.payment_category = 'Supplier / invoice';
          this.transfer_priority = 'Standard';
          this.schedule_date = new Date().toISOString().slice(0, 10);
          this.transactionPage = 1;

          this.isProcessingTransaction = false;
          Swal.fire({
            title: 'Transfer completed',
            html: `Reference <strong>${reference}</strong><br>Rs. ${amount.toLocaleString()} sent to ${destinationAccount}.`,
            icon: 'success',
            confirmButtonText: 'Done'
          });

          if (this.account_id && localStorage.getItem('demoMode') !== 'true') {
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

  trackByTransaction(index: number, transaction: any): string {
    return transaction?.reference || this.transactionReference(transaction, index);
  }

  transactionReference(transaction: any, index: number = 0): string {
    if (transaction?.reference) {
      return transaction.reference;
    }
    const rawDate = transaction?.date ? new Date(transaction.date).getTime().toString().slice(-6) : '000000';
    const accountSuffix = String(this.account_id || 'ACCT').slice(-4);
    return `TXN-${accountSuffix}-${rawDate}-${String(index + 1).padStart(2, '0')}`;
  }

  transactionDirection(transaction: any): 'Incoming' | 'Outgoing' {
    return transaction?.status === 'up' ? 'Incoming' : 'Outgoing';
  }

  transactionAuditState(transaction: any): string {
    return transaction?.audit_status || transaction?.ledger_status || 'Posted';
  }

  transactionCounterparty(transaction: any): string {
    if (transaction?.to_account) {
      return transaction.to_account;
    }
    if (transaction?.from_account) {
      return transaction.from_account;
    }
    return this.transactionDirection(transaction) === 'Incoming' ? 'External sender' : 'Beneficiary account';
  }

  downloadReceipt(transaction: any, index: number): void {
    const reference = this.transactionReference(transaction, index);
    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      icon: 'info',
      title: 'Transaction receipt',
      html: `
        <div class="demo-detail-grid">
          <div class="demo-detail-row"><span>Reference</span><strong>${reference}</strong></div>
          <div class="demo-detail-row"><span>Ledger status</span><strong>${this.transactionAuditState(transaction)}</strong></div>
          <div class="demo-detail-row"><span>Amount</span><strong>Rs. ${Number(transaction?.amount || 0).toLocaleString()}</strong></div>
          <div class="demo-detail-row"><span>Source account</span><strong>${this.maskAccountId(this.account_id)}</strong></div>
          <div class="demo-detail-row"><span>Generated</span><strong>${new Date().toLocaleString()}</strong></div>
        </div>
      `,
      confirmButtonText: 'Close'
    });
  }

  showTransactionDetails(transaction: any, index: number = 0): void {
    if (!transaction) {
      return;
    }

    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      title: this.transactionReference(transaction, index),
      html: `
        <div class="demo-detail-grid">
          <div class="demo-detail-row"><span>Transaction type</span><strong>${transaction.type || 'Transaction'}</strong></div>
          <div class="demo-detail-row"><span>Value date</span><strong>${transaction.date ? new Date(transaction.date).toLocaleString() : 'N/A'}</strong></div>
          <div class="demo-detail-row"><span>Amount</span><strong>Rs. ${Number(transaction.amount || 0).toLocaleString()}</strong></div>
          <div class="demo-detail-row"><span>Direction</span><strong>${this.transactionDirection(transaction)}</strong></div>
          <div class="demo-detail-row"><span>Counterparty</span><strong>${this.transactionCounterparty(transaction)}</strong></div>
          <div class="demo-detail-row"><span>Channel</span><strong>${transaction.channel || 'Online banking'}</strong></div>
          <div class="demo-detail-row"><span>Purpose</span><strong>${transaction.sender_remarks || 'No purpose captured'}</strong></div>
          <div class="demo-detail-row"><span>Beneficiary note</span><strong>${transaction.beneficiary_remarks || 'No beneficiary note'}</strong></div>
          <div class="demo-detail-row"><span>Audit state</span><strong>${this.transactionAuditState(transaction)}</strong></div>
        </div>
      `,
      icon: transaction.status === 'up' ? 'success' : 'info',
      confirmButtonText: 'Close'
    });
  }

  setTransactionPage(page: number): void {
    this.transactionPage = Math.max(1, Math.min(page, this.totalTransactionPages));
  }

  onTransactionFilterChange(): void {
    this.transactionPage = 1;
  }

  onPageSizeChange(): void {
    this.transactionPage = 1;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
