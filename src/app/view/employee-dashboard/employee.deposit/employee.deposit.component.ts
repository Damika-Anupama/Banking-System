import { isoDaysFromNow } from 'src/app/shared/local-date';
import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { DEMO_ACCOUNTS } from 'src/app/shared/demo-banking-fixtures';
import { ToastService } from 'src/app/service/toast.service';

interface DepositRecord {
  deposit_id: string;
  account_id: string;
  amount: number;
  method: string;
  deposit_time: string;
  status: string;
}

@Component({
  selector: 'app-employee.deposit',
  standalone: false,
  templateUrl: './employee.deposit.component.html',
  styleUrls: ['./employee.deposit.component.scss']
})
export class EmployeeDepositComponent implements OnInit {
  constructor(private toastService: ToastService) {}

  accountNumber = '';
  amount: number | null = null;
  method: 'Cash' | 'Cheque' | 'Transfer' = 'Cash';
  reference = '';
  isProcessing = false;

  /** True while the recent-deposit rows are being read into the view. */
  isLoading = true;

  /** Rough shape of the deposit table so the loading skeleton holds the layout. */
  readonly depositSkeletonColumns = ['Deposit ID', 'Account', 'Method', 'Amount', 'Time', 'Status'];

  ngOnInit(): void {
    // The demo fixtures resolve synchronously, but the flag keeps the page on
    // the same skeleton-while-loading pattern as the customer pages.
    this.isLoading = false;
  }

  // Local clone of branch accounts so deposits adjust the looked-up balance.
  accounts = DEMO_ACCOUNTS.map(a => ({ ...a }));

  // Relative dates: new in-session deposits stamp the real today, and a wall
  // of months-old seed rows next to them reads as a broken branch.
  deposits: DepositRecord[] = [
    { deposit_id: 'DEP-55021', account_id: 'ACC-492812', amount: 240000, method: 'Cash',     deposit_time: `${isoDaysFromNow(-1)}T11:05:00`, status: 'Completed' },
    { deposit_id: 'DEP-55014', account_id: 'ACC-492810', amount: 128000, method: 'Cheque',   deposit_time: `${isoDaysFromNow(-2)}T14:20:00`, status: 'Completed' },
    { deposit_id: 'DEP-55008', account_id: 'ACC-118209', amount: 64000,  method: 'Transfer', deposit_time: `${isoDaysFromNow(-3)}T09:35:00`, status: 'Completed' },
    { deposit_id: 'DEP-54996', account_id: 'ACC-492811', amount: 18500,  method: 'Cash',     deposit_time: `${isoDaysFromNow(-4)}T16:40:00`, status: 'Completed' }
  ];

  get totalDeposited(): number {
    return this.deposits.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  }

  depositPage = 1;
  readonly depositPageSize = 5;

  get totalDepositPages(): number {
    return Math.max(1, Math.ceil(this.deposits.length / this.depositPageSize));
  }

  get pagedDeposits(): DepositRecord[] {
    const page = Math.min(this.depositPage, this.totalDepositPages);
    const start = (page - 1) * this.depositPageSize;
    return this.deposits.slice(start, start + this.depositPageSize);
  }

  get depositRangeStart(): number {
    return this.deposits.length === 0 ? 0 : (Math.min(this.depositPage, this.totalDepositPages) - 1) * this.depositPageSize + 1;
  }

  get depositRangeEnd(): number {
    return Math.min(this.depositRangeStart + this.depositPageSize - 1, this.deposits.length);
  }

  setDepositPage(page: number): void {
    this.depositPage = Math.max(1, Math.min(page, this.totalDepositPages));
  }

  get matchedAccount(): any | null {
    const id = this.accountNumber.trim().toUpperCase();
    if (!id) return null;
    return this.accounts.find(a => String(a.account_id).toUpperCase() === id) || null;
  }

  get accountNotFound(): boolean {
    return this.accountNumber.trim().length > 0 && !this.matchedAccount;
  }

  get accountBalance(): number {
    return this.matchedAccount ? Number(this.matchedAccount.amount) : 0;
  }

  get chequeNeedsReference(): boolean {
    return this.method === 'Cheque' && !this.reference.trim();
  }

  get isValid(): boolean {
    return !!this.matchedAccount && !!this.amount && this.amount > 0 && !this.chequeNeedsReference;
  }

  formatSavingType(value: string): string {
    return value === 'CURRENT' ? 'Current' : value === 'SAVING' ? 'Saving' : 'Account';
  }

  methodIcon(method: string): string {
    if (method === 'Cheque') return 'fa-money-check-dollar';
    if (method === 'Transfer') return 'fa-right-left';
    return 'fa-money-bill-wave';
  }

  processDeposit(): void {
    if (this.accountNotFound) {
      this.toastService.error('Account not found', 'No branch account matches that number.');
      return;
    }
    if (this.chequeNeedsReference) {
      this.toastService.info('Cheque reference required', 'Enter the cheque number for a cheque deposit.');
      return;
    }
    if (!this.isValid) {
      this.toastService.error('Check the deposit details', 'Look up a valid account and enter an amount.');
      return;
    }

    const amount = Number(this.amount);
    const account = this.matchedAccount;
    const accountId = String(account.account_id).toUpperCase();
    const method = this.method;
    const ref = 'DEP-' + Date.now().toString().slice(-5);
    const clearing = method === 'Cheque' ? 'Pending clearing' : 'Completed';

    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      icon: 'question',
      title: 'Confirm deposit',
      html: `
        <div class="demo-detail-grid">
          <div class="demo-detail-row"><span>Reference</span><strong>${ref}</strong></div>
          <div class="demo-detail-row"><span>Account</span><strong>${accountId}</strong></div>
          <div class="demo-detail-row"><span>Method</span><strong>${method}</strong></div>
          <div class="demo-detail-row"><span>Current balance</span><strong>Rs. ${this.accountBalance.toLocaleString()}</strong></div>
          <div class="demo-detail-row"><span>Amount</span><strong>Rs. ${amount.toLocaleString()}</strong></div>
          <div class="demo-detail-row"><span>Balance after</span><strong>Rs. ${(this.accountBalance + amount).toLocaleString()}</strong></div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Process deposit',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.isProcessing = true;
      setTimeout(() => {
        // Credit the looked-up account so a follow-up reflects it (cleared funds only).
        if (clearing === 'Completed') {
          account.amount = String(this.accountBalance + amount);
        }
        this.deposits = [
          { deposit_id: ref, account_id: accountId, amount, method, deposit_time: new Date().toISOString(), status: clearing },
          ...this.deposits
        ];
        // Jump back to the first page so the new deposit is visible.
        this.depositPage = 1;
        this.accountNumber = '';
        this.amount = null;
        this.reference = '';
        this.method = 'Cash';
        this.isProcessing = false;

        Swal.fire({
          icon: 'success',
          title: 'Deposit recorded',
          html: `Reference <strong>${ref}</strong><br>Rs. ${amount.toLocaleString()} ${method.toLowerCase()} deposit to ${accountId}.${clearing === 'Pending clearing' ? '<br><small>Cheque funds available after clearing.</small>' : ''}`,
          confirmButtonText: 'Done'
        });
      }, 600);
    });
  }
}
