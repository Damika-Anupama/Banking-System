import { Component } from '@angular/core';
import Swal from 'sweetalert2';
import { DEMO_ACCOUNTS } from 'src/app/shared/demo-banking-fixtures';

interface WithdrawalRecord {
  withdrawal_id: string;
  account_id: string;
  amount: number;
  withdrawal_time: string;
  status: string;
}

@Component({
  selector: 'app-employee.withdrawal',
  standalone: false,
  templateUrl: './employee.withdrawal.component.html',
  styleUrls: ['./employee.withdrawal.component.scss']
})
export class EmployeeWithdrawalComponent {
  accountNumber = '';
  amount: number | null = null;
  isProcessing = false;

  // Local clone of branch accounts so withdrawals adjust the looked-up balance.
  accounts = DEMO_ACCOUNTS.map(a => ({ ...a }));

  withdrawals: WithdrawalRecord[] = [
    { withdrawal_id: 'WDR-33014', account_id: 'ACC-492810', amount: 25000,  withdrawal_time: '2026-05-24T10:15:00', status: 'Completed' },
    { withdrawal_id: 'WDR-33009', account_id: 'ACC-118209', amount: 80000,  withdrawal_time: '2026-05-23T15:45:00', status: 'Completed' },
    { withdrawal_id: 'WDR-32998', account_id: 'ACC-772901', amount: 12000,  withdrawal_time: '2026-05-22T11:10:00', status: 'Completed' },
    { withdrawal_id: 'WDR-32985', account_id: 'ACC-492812', amount: 50000,  withdrawal_time: '2026-05-21T14:30:00', status: 'Completed' }
  ];

  get totalWithdrawn(): number {
    return this.withdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);
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

  get exceedsBalance(): boolean {
    return !!this.matchedAccount && !!this.amount && Number(this.amount) > this.accountBalance;
  }

  get isValid(): boolean {
    return !!this.matchedAccount && !!this.amount && this.amount > 0 && !this.exceedsBalance;
  }

  formatSavingType(value: string): string {
    return value === 'CURRENT' ? 'Current' : value === 'SAVING' ? 'Saving' : 'Account';
  }

  processWithdrawal(): void {
    if (this.accountNotFound) {
      Swal.fire({ icon: 'error', title: 'Account not found', text: 'No branch account matches that number.' });
      return;
    }
    if (this.exceedsBalance) {
      Swal.fire({ icon: 'error', title: 'Insufficient balance', text: `Amount exceeds the available balance of Rs. ${this.accountBalance.toLocaleString()}.` });
      return;
    }
    if (!this.isValid) {
      Swal.fire({ icon: 'error', title: 'Validation error', text: 'Look up a valid account and enter an amount.' });
      return;
    }

    const amount = Number(this.amount);
    const account = this.matchedAccount;
    const accountId = String(account.account_id).toUpperCase();
    const reference = 'WDR-' + Date.now().toString().slice(-5);

    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      icon: 'question',
      title: 'Confirm withdrawal',
      html: `
        <div class="demo-detail-grid">
          <div class="demo-detail-row"><span>Reference</span><strong>${reference}</strong></div>
          <div class="demo-detail-row"><span>Account</span><strong>${accountId}</strong></div>
          <div class="demo-detail-row"><span>Available balance</span><strong>Rs. ${this.accountBalance.toLocaleString()}</strong></div>
          <div class="demo-detail-row"><span>Amount</span><strong>Rs. ${amount.toLocaleString()}</strong></div>
          <div class="demo-detail-row"><span>Balance after</span><strong>Rs. ${(this.accountBalance - amount).toLocaleString()}</strong></div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Process withdrawal',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.isProcessing = true;
      setTimeout(() => {
        // Debit the looked-up account so a follow-up withdrawal reflects it.
        account.amount = String(this.accountBalance - amount);
        this.withdrawals = [
          { withdrawal_id: reference, account_id: accountId, amount, withdrawal_time: new Date().toISOString(), status: 'Completed' },
          ...this.withdrawals
        ];
        this.accountNumber = '';
        this.amount = null;
        this.isProcessing = false;

        Swal.fire({
          icon: 'success',
          title: 'Withdrawal processed',
          html: `Reference <strong>${reference}</strong><br>Rs. ${amount.toLocaleString()} withdrawn from ${accountId}.`,
          confirmButtonText: 'Done'
        });
      }, 600);
    });
  }
}
