import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { TransactionService } from 'src/app/service/customer/transaction.service';
import { Subscription } from 'rxjs';
import { demoStore } from 'src/app/shared/demo-store';
import { createDemoBeneficiary } from 'src/app/shared/demo-banking-fixtures';
import { ToastService } from 'src/app/service/toast.service';
import { TableSort } from 'src/app/shared/table-sort';

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
  beneficiaries: any[] = [];
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

  /** Mirrors the transaction table's headers so the skeleton holds the same layout. */
  readonly transactionSkeletonColumns = [
    'Reference',
    'Value date',
    'Type & narration',
    'Direction',
    'Amount',
    'Status',
    'Actions',
  ];
  readonly transactionPageSizes = [6, 10, 15];
  readonly paymentCategories = ['Supplier / invoice', 'Rent / lease', 'Family support', 'Utilities', 'Tax / government', 'Other'];
  transferStep = 1;
  readonly transferSteps = [
    { num: 1, label: 'Beneficiary', icon: 'fa-user-check' },
    { num: 2, label: 'Amount', icon: 'fa-money-bill-wave' },
    { num: 3, label: 'Review', icon: 'fa-shield-check' },
  ];
  private subscriptions: Subscription[] = [];

  /** Fields the user has interacted with, so errors appear on blur, not while typing. */
  touched: Record<string, boolean> = {};

  private readonly validatedFields = [
    'to_account',
    'transfer_amount',
    'sender_remarks',
    'beneficiary_remarks',
  ];

  /**
   * The single source of truth for transfer validity: the form, the step gates
   * and proceedTransaction() all read these, so a rule cannot be enforced in one
   * place and forgotten in another.
   */
  get fieldErrors(): Record<string, string | null> {
    const to = this.to_account.trim().toUpperCase();
    const from = (this.account_id || '').trim().toUpperCase();
    const amount = Number(this.transfer_amount);

    return {
      to_account: !to
        ? 'Enter a beneficiary account number.'
        : !/^ACC-?\d{6,}$/.test(to)
          ? 'Use a valid account format, such as ACC-492811.'
          : to === from
            ? 'You cannot transfer to the same account.'
            : null,

      transfer_amount: !this.transfer_amount
        ? 'Enter an amount.'
        : !Number.isFinite(amount) || amount <= 0
          ? 'Enter a valid positive amount.'
          : amount > Number(this.balance || 0)
            ? `Amount exceeds your available balance of Rs. ${this.availableBalance.toLocaleString()}.`
            : amount > this.dailyTransferLimit
              ? `Single demo transfers are limited to Rs. ${this.dailyTransferLimit.toLocaleString()}.`
              : null,

      sender_remarks: this.sender_remarks.trim() ? null : 'Add a payment purpose.',

      beneficiary_remarks: this.beneficiary_remarks.trim()
        ? null
        : 'Add a note for the beneficiary.',
    };
  }

  get hasFieldErrors(): boolean {
    return this.validatedFields.some((field) => this.fieldErrors[field]);
  }

  get firstFieldError(): string | null {
    for (const field of this.validatedFields) {
      const error = this.fieldErrors[field];
      if (error) return error;
    }
    return null;
  }

  /** An error is only shown once the user has left the field, to avoid nagging mid-type. */
  errorFor(field: string): string | null {
    return this.touched[field] ? this.fieldErrors[field] : null;
  }

  markTouched(field: string): void {
    this.touched[field] = true;
  }

  markAllTouched(): void {
    this.validatedFields.forEach((field) => (this.touched[field] = true));
  }

  get step1Valid(): boolean {
    const from = (this.account_id || '').toUpperCase();
    const to = this.to_account.trim().toUpperCase();
    return Boolean(from && to && from !== to);
  }

  get step2Valid(): boolean {
    return Boolean(
      this.transfer_amount && Number(this.transfer_amount) > 0 &&
      this.sender_remarks.trim() && this.beneficiary_remarks.trim()
    );
  }

  nextTransferStep(): void {
    if (this.transferStep === 1 && !this.step1Valid) {
      // Reveal the inline error on the offending field instead of only toasting.
      this.markTouched('to_account');
      this.toastService.info('Add beneficiary details', 'Choose a source account and a valid (different) beneficiary account.');
      return;
    }
    if (this.transferStep === 2 && !this.step2Valid) {
      ['transfer_amount', 'sender_remarks', 'beneficiary_remarks'].forEach((field) =>
        this.markTouched(field)
      );
      this.toastService.info('Complete the amount step', 'Enter an amount, payment purpose, and beneficiary note.');
      return;
    }
    this.transferStep = Math.min(3, this.transferStep + 1);
  }

  prevTransferStep(): void {
    this.transferStep = Math.max(1, this.transferStep - 1);
  }

  goToTransferStep(step: number): void {
    if (step <= this.transferStep) { this.transferStep = step; return; }
    if (this.transferStep === 1 && !this.step1Valid) return;
    if (this.transferStep === 2 && !this.step2Valid) return;
    this.transferStep = step;
  }

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

  /**
   * Rows tagged with their position in the *unfiltered* ledger.
   *
   * A transaction without a server reference falls back to one derived from its
   * row position. Deriving that from the filtered position meant the same
   * payment showed a different reference depending on the active search or
   * filter — and sorting would have shuffled them again. The original index is
   * captured once here and travels with the row.
   */
  get decoratedTransactions(): { row: any; index: number }[] {
    return (this.transactions || []).map((row, index) => ({ row, index }));
  }

  /** Filtered + sorted rows, each still carrying its original ledger position. */
  get filteredDecorated(): { row: any; index: number }[] {
    const query = this.transactionSearchTerm.trim().toLowerCase();

    const matched = this.decoratedTransactions.filter(({ row, index }) => {
      const direction = this.transactionDirection(row);
      const matchesDirection = this.transactionDirectionFilter === 'all'
        || (this.transactionDirectionFilter === 'in' && direction === 'Incoming')
        || (this.transactionDirectionFilter === 'out' && direction === 'Outgoing');
      const matchesStatus = this.transactionStatusFilter === 'all' || this.transactionAuditState(row).toLowerCase().includes(this.transactionStatusFilter);
      const searchable = [
        this.transactionReference(row, index),
        row?.type,
        row?.channel,
        row?.sender_remarks,
        row?.beneficiary_remarks,
        row?.amount,
        row?.date,
        direction,
        this.transactionAuditState(row)
      ].join(' ').toLowerCase();

      return matchesDirection && matchesStatus && (!query || searchable.includes(query));
    });

    return this.sort.apply(matched);
  }

  get filteredTransactions(): any[] {
    return this.filteredDecorated.map(({ row }) => row);
  }

  // ---- Sorting -------------------------------------------------------------

  /**
   * Sorts the decorated rows, so a row keeps the ledger position its reference
   * is derived from even after reordering.
   */
  readonly sort = new TableSort<{ row: any; index: number }>({
    date: ({ row }) => new Date(row?.date || 0).getTime(),
    amount: ({ row }) => Number(row?.amount || 0),
    type: ({ row }) => String(row?.type || '').toLowerCase(),
    status: ({ row }) => this.transactionAuditState(row).toLowerCase(),
  });

  toggleSort(column: string): void {
    this.sort.toggle(column);
    // Staying on page 3 of a re-sorted list shows rows nobody asked for.
    this.transactionPage = 1;
  }

  sortStateFor(column: string): 'ascending' | 'descending' | 'none' {
    return this.sort.stateFor(column);
  }

  sortIconFor(column: string): string {
    return this.sort.iconFor(column);
  }

  trackByEntry(_i: number, entry: { row: any; index: number }): string {
    return this.transactionReference(entry.row, entry.index);
  }

  get totalTransactionPages(): number {
    return Math.max(1, Math.ceil(this.filteredTransactions.length / this.transactionPageSize));
  }

  get paginatedTransactions(): { row: any; index: number }[] {
    const page = Math.min(this.transactionPage, this.totalTransactionPages);
    const start = (page - 1) * this.transactionPageSize;
    return this.filteredDecorated.slice(start, start + this.transactionPageSize);
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

  get transferReviewItems(): { label: string; value: string }[] {
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

  constructor(
    private router: Router,
    private transactionService: TransactionService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAccountDetails();
    this.beneficiaries = demoStore.getBeneficiaries();
  }

  selectBeneficiary(beneficiary: any): void {
    if (!beneficiary) return;
    this.to_account = beneficiary.account_id;
    this.beneficiary_name = beneficiary.name;
  }

  get canSaveBeneficiary(): boolean {
    const acc = this.to_account.trim();
    return acc.length > 0 && !demoStore.hasBeneficiary(acc);
  }

  async saveBeneficiary(): Promise<void> {
    const account = this.to_account.trim().toUpperCase();
    if (!account) {
      this.toastService.info('No account entered', 'Enter a beneficiary account number first.');
      return;
    }
    if (demoStore.hasBeneficiary(account)) {
      this.toastService.info('Already saved', 'This account is already in your beneficiaries.');
      return;
    }
    const result = await Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      title: 'Save beneficiary',
      input: 'text',
      inputLabel: `Name for ${account}`,
      inputValue: this.beneficiary_name || '',
      inputPlaceholder: 'e.g. Sunil Construction',
      showCancelButton: true,
      confirmButtonText: 'Save',
      inputValidator: (value) => (!value || !value.trim() ? 'Please enter a name' : null)
    });
    if (!result.isConfirmed || !result.value) return;

    demoStore.addBeneficiary(createDemoBeneficiary({ name: result.value.trim(), account_id: account }));
    this.beneficiaries = demoStore.getBeneficiaries();
    this.toastService.success('Beneficiary saved');
  }

  removeBeneficiary(beneficiary: any, event: Event): void {
    event.stopPropagation();
    demoStore.removeBeneficiary(beneficiary.id);
    this.beneficiaries = demoStore.getBeneficiaries();
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
          this.toastService.error('Could not load accounts', this.errorMessage);
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
            this.toastService.warning('No accounts', 'You do not have any accounts yet.');
          }

          this.isLoading = false;
        } catch (error) {
          console.error('Error processing account data:', error);
          this.errorMessage = 'Failed to process account data';
          this.isLoading = false;
          this.toastService.error('Could not load accounts', this.errorMessage);
        }
      },
      error: (err) => {
        console.error('Error loading account details:', err);
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load account details';
        this.isLoading = false;

        this.toastService.error('Could not load accounts', this.errorMessage);
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
      this.toastService.error('Transaction failed', 'Invalid response from server');
      return;
    }

    if (data.message == 'Transfer created successfully!') {
      this.toastService.success('Transfer created', data.message);
    } else {
      this.toastService.error('Transaction failed', data.message || 'Transaction failed');
    }
  }

  async proceedTransaction() {
    // Surface every problem at once, against the field that caused it, rather
    // than rejecting the form one error at a time.
    this.markAllTouched();

    if (this.hasFieldErrors) {
      this.toastService.error('Check the highlighted fields', this.firstFieldError ?? undefined);
      return;
    }

    if (!this.account_id) {
      this.toastService.error('No source account', 'Select the account to transfer from.');
      return;
    }

    const amount = Number(this.transfer_amount);
    const normalizedToAccount = this.to_account.trim().toUpperCase();
    this.to_account = normalizedToAccount;

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
          this.transferStep = 1;

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
          this.toastService.error('Transfer failed', 'Failed to process transaction response.');
        }
      },
      error: (err) => {
        console.error('Error processing transaction:', err);
        this.errorMessage = err?.error?.message || err?.message || 'Failed to process transaction';
        this.isProcessingTransaction = false;

        this.toastService.error('Transfer failed', this.errorMessage);
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

  downloadStatement(): void {
    const rows = this.filteredTransactions;
    if (!rows.length) {
      this.toastService.info('Nothing to export', 'There are no transactions matching the current filters.');
      return;
    }

    const escape = (value: any): string => {
      const text = String(value ?? '');
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };

    const header = ['Reference', 'Date', 'Type', 'Direction', 'Amount (Rs.)', 'Status', 'Purpose', 'Beneficiary note'];
    const lines = rows.map((txn, i) => [
      this.transactionReference(txn, i),
      txn.date ? new Date(txn.date).toISOString() : '',
      txn.type || '',
      this.transactionDirection(txn),
      Number(txn.amount || 0),
      this.transactionAuditState(txn),
      txn.sender_remarks || '',
      txn.beneficiary_remarks || ''
    ].map(escape).join(','));

    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `statement-${String(this.account_id || 'account')}-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.toastService.success(
      'Statement downloaded',
      `${rows.length} transaction${rows.length === 1 ? '' : 's'} exported as CSV.`
    );
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
