import { Component, OnInit, OnDestroy } from '@angular/core';
import { fd } from 'src/app/model/FD';
import { fdPackage } from 'src/app/model/FDpackage';
import { FDSelectedSavingAccount } from 'src/app/model/FDSelectedSavingAccount';
import { FixedDepositService } from 'src/app/service/customer/fixed-deposit.service';
import { LoanService } from 'src/app/service/customer/loan.service';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';
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

  /** Mirrors the fixed deposit table's headers so the skeleton holds the same layout. */
  readonly fdSkeletonColumns = ['Deposit', 'Duration', 'Maturity', 'Status', 'Actions'];
  isCreatingFD = false;
  errorMessage = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private fdService: FixedDepositService,
    private loanService: LoanService,
    private toastService: ToastService
  ) {}

  /** Fields the user has left, so errors appear on blur rather than while typing. */
  touched: Record<string, boolean> = {};

  private readonly validatedFields = [
    'selectedSavingAccount',
    'selectedPackage',
    'fdAmount',
    'acceptedTerms',
  ];

  /**
   * Single source of truth for FD placement validity. checkForm() and the
   * inline errors read the same rules.
   */
  get fieldErrors(): Record<string, string | null> {
    const raw = this.fdAmount;
    const amount = Number(raw);

    return {
      selectedSavingAccount: this.selectedSavingAccount?.saving_account_id
        ? null
        : 'Select the saving account to fund this deposit.',

      selectedPackage: this.selectedPackage ? null : 'Choose a deposit package.',

      fdAmount: !raw
        ? 'Enter a deposit amount.'
        : !raw.toString().match(/^[0-9]+$/)
          ? 'Enter a valid amount (whole numbers only).'
          : !Number.isFinite(amount) || amount <= 0
            ? 'Enter a valid positive amount.'
            : amount > this.selectedAccountBalance
              ? `Amount cannot exceed the account balance of Rs. ${this.selectedAccountBalance.toLocaleString()}.`
              : null,

      // Locking money away has real consequences, so this consent is explicit.
      acceptedTerms: this.acceptedTerms
        ? null
        : 'Accept the maturity and early withdrawal terms before placing the deposit.',
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

  errorFor(field: string): string | null {
    return this.touched[field] ? this.fieldErrors[field] : null;
  }

  markTouched(field: string): void {
    this.touched[field] = true;
  }

  markAllTouched(): void {
    this.validatedFields.forEach((field) => (this.touched[field] = true));
  }

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
          return;
        }

        this.savingAccounts = Array.isArray(res.result) ? res.result : [];
        this.isLoadingSavingAccounts = false;
      },
      error: (err) => {
        console.error('Error loading saving accounts:', err);
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load saving accounts';
        this.isLoadingSavingAccounts = false;
        this.savingAccounts = [];

        this.toastService.error('Could not load fixed deposits', this.errorMessage);
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

  get fdCount(): number {
    return Array.isArray(this.fds) ? this.fds.length : 0;
  }

  get totalInvested(): number {
    if (!Array.isArray(this.fds)) return 0;
    return this.fds.reduce((sum: number, item: any) => sum + Number(item?.amount || 0), 0);
  }

  get totalAtMaturity(): number {
    if (!Array.isArray(this.fds)) return 0;
    return this.fds.reduce((sum: number, item: any) => sum + this.fdMaturityAmount(item), 0);
  }

  get nearestMaturityDate(): Date | null {
    if (!Array.isArray(this.fds) || this.fds.length === 0) return null;
    return this.fds
      .map((item: any) => this.fdMaturityDate(item))
      .sort((a: Date, b: Date) => a.getTime() - b.getTime())[0];
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
    // Surface every problem at once, against the field that caused it.
    this.markAllTouched();

    if (this.hasFieldErrors) {
      this.toastService.error('Check the highlighted fields', this.firstFieldError ?? undefined);
      return;
    }

    const amount = Number(this.fdAmount);

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
          this.toastService.error('Invalid package', 'Please select a valid package.');
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
          this.toastService.error('Invalid package', 'Please select a valid package.');
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

          this.toastService.error('Could not place deposit', this.errorMessage);
        }
      });

      this.subscriptions.push(sub);
    } catch (error) {
      console.error('Error processing FD creation:', error);
      this.toastService.error('Could not place deposit', 'Failed to process fixed deposit creation.');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
