import { Component } from '@angular/core';
import Swal from 'sweetalert2';

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

  withdrawals: WithdrawalRecord[] = [
    { withdrawal_id: 'WDR-33014', account_id: 'ACC-492810', amount: 25000,  withdrawal_time: '2026-05-24T10:15:00', status: 'Completed' },
    { withdrawal_id: 'WDR-33009', account_id: 'ACC-118209', amount: 80000,  withdrawal_time: '2026-05-23T15:45:00', status: 'Completed' },
    { withdrawal_id: 'WDR-32998', account_id: 'ACC-772901', amount: 12000,  withdrawal_time: '2026-05-22T11:10:00', status: 'Completed' },
    { withdrawal_id: 'WDR-32985', account_id: 'ACC-492812', amount: 50000,  withdrawal_time: '2026-05-21T14:30:00', status: 'Completed' }
  ];

  get totalWithdrawn(): number {
    return this.withdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);
  }

  get isValid(): boolean {
    return !!this.accountNumber.trim() && !!this.amount && this.amount > 0;
  }

  processWithdrawal(): void {
    if (!this.isValid) {
      Swal.fire({ icon: 'error', title: 'Validation error', text: 'Enter a valid account number and amount.' });
      return;
    }

    const amount = Number(this.amount);
    const accountId = this.accountNumber.trim().toUpperCase();
    const reference = 'WDR-' + Date.now().toString().slice(-5);

    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      icon: 'question',
      title: 'Confirm withdrawal',
      html: `
        <div class="demo-detail-grid">
          <div class="demo-detail-row"><span>Reference</span><strong>${reference}</strong></div>
          <div class="demo-detail-row"><span>Account</span><strong>${accountId}</strong></div>
          <div class="demo-detail-row"><span>Amount</span><strong>Rs. ${amount.toLocaleString()}</strong></div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Process withdrawal',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.isProcessing = true;
      setTimeout(() => {
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
