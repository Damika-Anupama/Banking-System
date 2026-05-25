import { Component, OnInit, OnDestroy } from '@angular/core';
import { fd } from 'src/app/model/FD';
import { fdPackage } from 'src/app/model/FDpackage';
import { FDSelectedSavingAccount } from 'src/app/model/FDSelectedSavingAccount';
import { FixedDepositService } from 'src/app/service/customer/fixed-deposit.service';
import { LoanService } from 'src/app/service/customer/loan.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-fixed-deposit',
  standalone: false,
  templateUrl: './fixed-deposit.component.html',
  styleUrls: ['./fixed-deposit.component.scss'],
})
export class FixedDepositComponent implements OnInit, OnDestroy {
  fds: any;
  savingAccounts: any;
  selectedSavingAccount: FDSelectedSavingAccount | undefined;
  selectedPackage: number | undefined;
  packageArray: fdPackage[] = [
    { index: 1, period: '6 months', interest: '13%' },
    { index: 2, period: '1 year', interest: '14%' },
    { index: 3, period: '3 years', interest: '15%' },
  ];
  savingAccountId: any;
  duration: any;
  rpa: any;
  fdAmount: any;
  acceptedTerms = false;

  isLoadingSavingAccounts = false;
  isLoadingFDs = false;
  isCreatingFD = false;
  errorMessage = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private fdService: FixedDepositService,
    private loanService: LoanService
  ) {}

  ngOnInit(): void {
    this.loadSavingAccounts();
    this.loadFDs();
  }

  loadSavingAccounts() {
    this.isLoadingSavingAccounts = true;
    this.errorMessage = '';

    const sub = this.fdService.getSavingAccountsDetails().subscribe({
      next: (res) => {
        // Null/undefined checks
        if (!res || !res.result) {
          this.savingAccounts = [];
          this.isLoadingSavingAccounts = false;
          Swal.fire({
            icon: 'warning',
            title: 'No Saving Accounts',
            text: 'You do not have any saving accounts available.'
          });
          return;
        }

        this.savingAccounts = Array.isArray(res.result) ? res.result : [];
        this.isLoadingSavingAccounts = false;

        if (this.savingAccounts.length === 0) {
          Swal.fire({
            icon: 'info',
            title: 'No Saving Accounts',
            text: 'You need to create a saving account before creating a fixed deposit.'
          });
        }
      },
      error: (err) => {
        console.error('Error loading saving accounts:', err);
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load saving accounts';
        this.isLoadingSavingAccounts = false;
        this.savingAccounts = [];

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.errorMessage
        });
      }
    });

    this.subscriptions.push(sub);
  }

  loadFDs() {
    this.isLoadingFDs = true;

    const sub = this.loanService.getFDs().subscribe({
      next: (data) => {
        // Null/undefined checks
        if (!data || !data.data) {
          this.fds = [];
          this.isLoadingFDs = false;
          return;
        }

        this.fds = Array.isArray(data.data) ? data.data : [];
        this.isLoadingFDs = false;
      },
      error: (err) => {
        console.error('Error loading FDs:', err);
        this.fds = [];
        this.isLoadingFDs = false;

        // Don't show error popup for FDs load failure
        // Just log it to console
      }
    });

    this.subscriptions.push(sub);
  }

  onAccountSelected() {
    // Null check for selectedSavingAccount
    if (!this.selectedSavingAccount || !this.selectedSavingAccount.saving_account_id) {
      this.savingAccountId = null;
      return;
    }

    this.savingAccountId = this.selectedSavingAccount.saving_account_id;
  }

  onPackageSelected() {
    // Validate selectedPackage
    if (!this.selectedPackage) {
      this.duration = null;
      this.rpa = null;
      return;
    }

    for (const element of this.packageArray) {
      if (element.index === Number(this.selectedPackage)) {
        this.duration = element.period;
        this.rpa = element.interest;
        return;
      }
    }
  }

  convertDuration(duration: any) {
    if (!duration) return '';
    return duration.replace(/_/g, ' ').toLowerCase();
  }

  get selectedAccountBalance(): number {
    return Number(this.selectedSavingAccount?.amount || 0);
  }

  get estimatedInterest(): number {
    return (Number(this.fdAmount || 0) * Number(String(this.rpa || '0').replace('%', ''))) / 100;
  }

  get maturityAmount(): number {
    return Number(this.fdAmount || 0) + this.estimatedInterest;
  }

  get maturityDate(): Date | null {
    if (!this.duration) return null;
    const date = new Date();
    const months = this.duration === '6 months' ? 6 : this.duration === '1 year' ? 12 : 36;
    date.setMonth(date.getMonth() + months);
    return date;
  }

  fdMaturityDate(fdItem: any): Date {
    const date = new Date(fdItem.fd_opening_date || new Date());
    const months = String(fdItem.duration || '').includes('SIX') || String(fdItem.duration || '').includes('6') ? 6 : String(fdItem.duration || '').includes('THREE') || String(fdItem.duration || '').includes('3') ? 36 : 12;
    date.setMonth(date.getMonth() + months);
    return date;
  }

  fdMaturityAmount(fdItem: any): number {
    return Number(fdItem.amount || 0) + ((Number(fdItem.amount || 0) * Number(fdItem.rate_per_annum || 0)) / 100);
  }

  fdStatus(fdItem: any): string {
    return fdItem.status || 'Active';
  }

  viewFDCertificate(fdItem: any): void {
    Swal.fire({
      icon: 'info',
      title: `FD certificate ${fdItem.fd_id}`,
      html: `Maturity: <strong>${this.fdMaturityDate(fdItem).toLocaleDateString()}</strong><br>Maturity value: <strong>Rs. ${this.fdMaturityAmount(fdItem).toLocaleString()}</strong><br>Renewal instruction: Credit principal and interest`,
      confirmButtonText: 'Close'
    });
  }

  async checkForm() {
    // Form validation
    if (!this.selectedSavingAccount || !this.selectedPackage || !this.fdAmount) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please select appropriate saving account, package and mention FD amount.',
        icon: 'error',
      });
      return;
    }

    // Validate FD amount is a number
    if (!this.fdAmount.toString().match(/^[0-9]+$/)) {
      Swal.fire({
        title: 'Invalid Amount',
        text: 'Please enter valid amount (numbers only).',
        icon: 'error',
      });
      return;
    }

    // Validate FD amount is positive
    const amount = Number(this.fdAmount);
    if (isNaN(amount) || amount <= 0) {
      Swal.fire({
        title: 'Invalid Amount',
        text: 'Please enter a valid positive amount.',
        icon: 'error',
      });
      return;
    }

    // Validate savingAccountId exists
    if (!this.savingAccountId) {
      Swal.fire({
        title: 'Error',
        text: 'Invalid saving account selected.',
        icon: 'error',
      });
      return;
    }

    if (amount > this.selectedAccountBalance) {
      Swal.fire({
        title: 'Insufficient Account Balance',
        text: 'Deposit amount cannot exceed the selected saving account balance.',
        icon: 'error',
      });
      return;
    }

    if (!this.acceptedTerms) {
      Swal.fire({
        title: 'Terms Required',
        text: 'Please accept the maturity and early withdrawal terms before placing the fixed deposit.',
        icon: 'warning',
      });
      return;
    }

    try {
      // Convert duration
      let durationCode: string;
      switch (this.duration) {
        case '6 months':
          durationCode = "6_MONTH";
          break;
        case '1 year':
          durationCode = "1_YEAR";
          break;
        case '3 years':
          durationCode = "3_YEARS";
          break;
        default:
          Swal.fire({
            title: 'Invalid Duration',
            text: 'Please select a valid package.',
            icon: 'error',
          });
          return;
      }

      // Convert RPA
      let rpaCode: string;
      switch (this.rpa) {
        case '13%':
          rpaCode = "13";
          break;
        case '14%':
          rpaCode = "14";
          break;
        case '15%':
          rpaCode = "15";
          break;
        default:
          Swal.fire({
            title: 'Invalid Interest Rate',
            text: 'Please select a valid package.',
            icon: 'error',
          });
          return;
      }

      const reference = 'FD-' + Date.now().toString().slice(-8);
      const confirmation = await Swal.fire({
        icon: 'question',
        title: 'Review fixed deposit placement',
        html: `
          <div style="text-align:left;line-height:1.8">
            <strong>Reference:</strong> ${reference}<br>
            <strong>Saving account:</strong> ${this.savingAccountId}<br>
            <strong>Amount:</strong> Rs. ${amount.toLocaleString()}<br>
            <strong>Term:</strong> ${this.duration}<br>
            <strong>Rate:</strong> ${this.rpa} per annum
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Place fixed deposit',
        cancelButtonText: 'Review again'
      });

      if (!confirmation.isConfirmed) {
        return;
      }

      this.isCreatingFD = true;
      this.errorMessage = '';

      const sub = this.fdService.createFD(
        this.savingAccountId,
        durationCode,
        rpaCode,
        amount
      ).subscribe({
        next: (data) => {
          this.isCreatingFD = false;

          Swal.fire({
            title: 'Fixed deposit placed',
            html: `Reference <strong>${reference}</strong><br>Rs. ${amount.toLocaleString()} placed for ${this.duration}.`,
            icon: 'success',
            confirmButtonText: 'Done'
          });

          // Reset form
          this.selectedSavingAccount = undefined;
          this.selectedPackage = undefined;
          this.fdAmount = null;
          this.savingAccountId = null;
          this.duration = null;
          this.rpa = null;

          // Reload FDs
          this.loadFDs();
        },
        error: (err) => {
          console.error('Error creating FD:', err);
          this.errorMessage = err?.error?.message || err?.message || 'Failed to create fixed deposit';
          this.isCreatingFD = false;

          Swal.fire({
            icon: 'error',
            title: 'FD Creation Failed',
            text: this.errorMessage
          });
        }
      });

      this.subscriptions.push(sub);
    } catch (error) {
      console.error('Error processing FD creation:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to process fixed deposit creation'
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
