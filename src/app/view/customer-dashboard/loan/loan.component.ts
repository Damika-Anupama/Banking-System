import { Component, OnInit, OnDestroy } from '@angular/core';
import { fd } from 'src/app/model/FD';
import { loanPackage } from 'src/app/model/LoanPackage';
import { LoanService } from 'src/app/service/customer/loan.service';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';
import { Subscription } from 'rxjs';
import { focusFirstError } from 'src/app/shared/focus-first-error';

@Component({
  selector: 'app-loan',
  standalone: false,
  templateUrl: './loan.component.html',
  styleUrls: ['./loan.component.scss'],
})
export class LoanComponent implements OnInit, OnDestroy {
  fds: any;
  loans: any;
  selectedFD!: fd;
  selectedFDId: number = 0;
  maximumLoanAmount: number = 0;
  loanAmount: number = 0;
  selectedLoan: number | undefined;
  packageArray: loanPackage[] = [
    { index: 1, period: '6 months', interest: '13%' },
    { index: 2, period: '1 year', interest: '14%' },
    { index: 3, period: '3 years', interest: '15%' },
  ];
  duration: any;
  interest: any;
  selectedLoanType: string = '';
  acceptedLienConsent = false;

  isLoadingFDs = false;
  isLoadingLoans = false;

  /** Mirrors the loan table's headers so the skeleton holds the same layout. */
  readonly loanSkeletonColumns = ['Loan', 'Status', 'Outstanding', 'Next due', 'Actions'];
  isProcessingLoan = false;
  errorMessage = '';
  private subscriptions: Subscription[] = [];

  constructor(private loanService: LoanService, private toastService: ToastService) {}

  /** Fields the user has left, so errors appear on blur rather than while typing. */
  touched: Record<string, boolean> = {};

  private readonly validatedFields = [
    'selectedFD',
    'loanAmount',
    'selectedLoan',
    'selectedLoanType',
    'acceptedLienConsent',
  ];

  /**
   * Single source of truth for loan-application validity. proceed() and the
   * inline errors read the same rules, so a rule cannot be enforced on submit
   * but left invisible on the field that broke it.
   */
  get fieldErrors(): Record<string, string | null> {
    const amount = Number(this.loanAmount);

    return {
      selectedFD: this.selectedFD?.fd_id
        ? null
        : 'Select the fixed deposit to borrow against.',

      loanAmount: !this.loanAmount
        ? 'Enter a loan amount.'
        : !Number.isFinite(amount) || amount <= 0
          ? 'Enter a valid positive loan amount.'
          : amount > this.maximumLoanAmount
            ? `Amount cannot exceed your maximum of Rs. ${this.maximumLoanAmount.toFixed(2)}.`
            : null,

      selectedLoan: this.selectedLoan ? null : 'Choose a loan package.',

      selectedLoanType: this.selectedLoanType ? null : 'Choose a loan type.',

      // A lien puts the customer's fixed deposit at risk, so consent is explicit.
      acceptedLienConsent: this.acceptedLienConsent
        ? null
        : 'Consent to the lien on your fixed deposit before submitting.',
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

  /** The first field the form rejected, so focus can be sent straight to it. */
  get firstErrorField(): string | null {
    for (const field of this.validatedFields) {
      if (this.fieldErrors[field]) return field;
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
    this.loadFDs();
    this.loadLoans();
  }

  loadFDs() {
    this.isLoadingFDs = true;
    this.errorMessage = '';

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
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load fixed deposits';
        this.isLoadingFDs = false;
        this.fds = [];

        this.toastService.error('Could not load loan workspace', this.errorMessage);
      }
    });

    this.subscriptions.push(sub);
  }

  loadLoans() {
    this.isLoadingLoans = true;

    const sub = this.loanService.getLoans().subscribe({
      next: (data) => {
        // Null/undefined checks
        if (!data || !data.data) {
          this.loans = [];
          this.isLoadingLoans = false;
          return;
        }

        this.loans = Array.isArray(data.data) ? data.data : [];
        this.isLoadingLoans = false;
      },
      error: (err) => {
        console.error('Error loading loans:', err);
        this.loans = [];
        this.isLoadingLoans = false;

        // Don't show error popup for loans load failure
        // Just log it to console
      }
    });

    this.subscriptions.push(sub);
  }

  convertDuration(duration: any) {
    if (!duration) return '';
    return duration.replace(/_/g, ' ').toLowerCase();
  }

  loanPage = 1;
  readonly loanPageSize = 2;

  get activeLoanCount(): number {
    return Array.isArray(this.loans) ? this.loans.length : 0;
  }

  get totalLoanPages(): number {
    return Math.max(1, Math.ceil(this.activeLoanCount / this.loanPageSize));
  }

  get pagedLoans(): any[] {
    if (!Array.isArray(this.loans)) return [];
    const page = Math.min(this.loanPage, this.totalLoanPages);
    const start = (page - 1) * this.loanPageSize;
    return this.loans.slice(start, start + this.loanPageSize);
  }

  get loanRangeStart(): number {
    return this.activeLoanCount === 0 ? 0 : (Math.min(this.loanPage, this.totalLoanPages) - 1) * this.loanPageSize + 1;
  }

  get loanRangeEnd(): number {
    return Math.min(this.loanRangeStart + this.loanPageSize - 1, this.activeLoanCount);
  }

  setLoanPage(page: number): void {
    this.loanPage = Math.max(1, Math.min(page, this.totalLoanPages));
  }

  get totalBorrowed(): number {
    if (!Array.isArray(this.loans)) return 0;
    return this.loans.reduce((sum: number, loan: any) => sum + Number(loan?.amount || 0), 0);
  }

  get totalOutstanding(): number {
    if (!Array.isArray(this.loans)) return 0;
    return this.loans.reduce((sum: number, loan: any) => sum + this.loanOutstanding(loan), 0);
  }

  get nearestDueDate(): Date | null {
    if (!Array.isArray(this.loans) || this.loans.length === 0) return null;
    return this.loans
      .map((loan: any) => this.loanNextDueDate(loan))
      .sort((a: Date, b: Date) => a.getTime() - b.getTime())[0];
  }

  get ltvPercent(): number {
    return this.selectedFD?.amount ? Math.round((this.maximumLoanAmount / Number(this.selectedFD.amount)) * 100) : 0;
  }

  get estimatedMonthlyPayment(): number {
    const months = Math.max(1, Math.ceil(this.durationInDaysValue() / 30));
    const principal = Number(this.loanAmount || 0);
    const annualRate = Number(String(this.interest || '0').replace('%', '')) / 100;
    return Math.round((principal + principal * annualRate * (this.durationInDaysValue() / 365)) / months);
  }

  durationInDaysValue(): number {
    return this.duration === '6 months' ? 180 : this.duration === '1 year' ? 360 : this.duration === '3 years' ? 1080 : 0;
  }

  loanStatus(loan: any): string {
    return loan.status || 'Under Review';
  }

  loanOutstanding(loan: any): number {
    const principal = Number(loan?.amount || 0);
    const rate = Number(loan?.interest || 0) / 100;
    return Math.round(principal + principal * rate * (Number(loan?.duration_days || 0) / 365));
  }

  loanNextDueDate(loan: any): Date {
    const date = new Date(loan?.starting_date || new Date());
    date.setDate(date.getDate() + 30);
    return date;
  }

  remainingTenure(loan: any): string {
    const days = Number(loan?.duration_days || 0);
    return days >= 360 ? `${Math.round(days / 30)} months` : `${days} days`;
  }

  viewLoanSchedule(loan: any): void {
    Swal.fire({
      icon: 'info',
      title: `Loan schedule ${loan.loan_basic_detail_id}`,
      html: `Outstanding: <strong>Rs. ${this.loanOutstanding(loan).toLocaleString()}</strong><br>Next due date: <strong>${this.loanNextDueDate(loan).toLocaleDateString()}</strong><br>Remaining tenure: <strong>${this.remainingTenure(loan)}</strong>`,
      confirmButtonText: 'Close'
    });
  }

  downloadLoanAgreement(loan: any): void {
    Swal.fire({
      icon: 'info',
      title: 'Agreement ready',
      html: `Loan agreement <strong>${loan.loan_basic_detail_id}</strong> is ready for the client demo.`,
      confirmButtonText: 'Close'
    });
  }

  startRepayment(loan: any): void {
    Swal.fire({
      icon: 'question',
      title: 'Repayment preview',
      html: `Next repayment for <strong>${loan.loan_basic_detail_id}</strong><br>Due: ${this.loanNextDueDate(loan).toLocaleDateString()}<br>Outstanding: Rs. ${this.loanOutstanding(loan).toLocaleString()}`,
      confirmButtonText: 'Close'
    });
  }

  onFDSelected() {
    // Null check for selectedFD
    if (!this.selectedFD || !this.selectedFD.amount || !this.selectedFD.fd_id) {
      this.maximumLoanAmount = 0;
      this.toastService.error('Invalid selection', 'Please select a valid fixed deposit.');
      return;
    }

    try {
      const fdAmount = Number(this.selectedFD.amount);

      if (isNaN(fdAmount) || fdAmount <= 0) {
        this.maximumLoanAmount = 0;
        this.toastService.error('Invalid amount', 'Selected fixed deposit has an invalid amount.');
        return;
      }

      if (fdAmount * 0.6 < 500000) {
        this.maximumLoanAmount = fdAmount * 0.6;
        this.selectedFDId = this.selectedFD.fd_id;
      } else {
        this.maximumLoanAmount = 500000;
        this.selectedFDId = this.selectedFD.fd_id;
      }
    } catch (error) {
      console.error('Error calculating maximum loan amount:', error);
      this.maximumLoanAmount = 0;
      this.toastService.error('Could not calculate', 'Failed to calculate maximum loan amount.');
    }
  }

  onLoanSelected() {
    // Validate selectedLoan
    if (!this.selectedLoan) {
      this.duration = null;
      this.interest = null;
      return;
    }

    for (const element of this.packageArray) {
      if (element.index === Number(this.selectedLoan)) {
        this.duration = element.period;
        this.interest = element.interest;
        return;
      }
    }
  }

  checkLoanAmount() {
    // The amount rule lives in fieldErrors; leaving the field just reveals it.
    this.markTouched('loanAmount');
  }

  async proceed() {
    // Surface every problem at once, against the field that caused it.
    this.markAllTouched();

    if (this.hasFieldErrors) {
      this.toastService.error('Check the highlighted fields', this.firstFieldError ?? undefined);
      focusFirstError(this.firstErrorField);
      return;
    }

    // Validate user ID exists
    const userId = localStorage.getItem("userId") || (localStorage.getItem('demoMode') === 'true' ? 'CUS-1001' : null);
    if (!userId) {
      this.toastService.error('Session expired', 'User ID not found. Please log in again.');
      return;
    }

    try {
      // Convert loan type
      let loanType = this.selectedLoanType;
      if (loanType === 'Personal') {
        loanType = 'PERSONAL';
      } else if (loanType === 'Business') {
        loanType = 'BUSINESS';
      }

      // Convert interest
      let interestRate: number;
      switch (this.interest) {
        case '13%':
          interestRate = 13.00;
          break;
        case '14%':
          interestRate = 14.00;
          break;
        case '15%':
          interestRate = 15.00;
          break;
        default:
          this.toastService.error('Invalid package', 'Please select a valid loan package.');
          return;
      }

      // Convert duration
      let durationInDays: number;
      switch (this.duration) {
        case '6 months':
          durationInDays = 30 * 6;
          break;
        case '1 year':
          durationInDays = 30 * 12;
          break;
        case '3 years':
          durationInDays = 30 * 36;
          break;
        default:
          this.toastService.error('Invalid package', 'Please select a valid loan package.');
          return;
      }

      const reference = 'LN-' + Date.now().toString().slice(-8);
      const confirmation = await Swal.fire({
        icon: 'question',
        title: 'Review loan application',
        html: `
          <div style="text-align:left;line-height:1.8">
            <strong>Reference:</strong> ${reference}<br>
            <strong>Collateral FD:</strong> ${this.selectedFD.fd_id}<br>
            <strong>Requested amount:</strong> Rs. ${this.loanAmount.toLocaleString()}<br>
            <strong>Maximum eligible:</strong> Rs. ${this.maximumLoanAmount.toLocaleString()}<br>
            <strong>Term:</strong> ${this.duration}<br>
            <strong>Rate:</strong> ${this.interest} per annum<br>
            <strong>Loan type:</strong> ${loanType}
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Submit application',
        cancelButtonText: 'Review again'
      });

      if (!confirmation.isConfirmed) {
        return;
      }

      this.isProcessingLoan = true;
      this.errorMessage = '';

      const sub = this.loanService.applyLoan(
        this.selectedFD.fd_id,
        this.loanAmount,
        userId,
        String(durationInDays),
        String(interestRate),
        loanType
      ).subscribe({
        next: (data) => {
          this.isProcessingLoan = false;

          Swal.fire({
            icon: 'success',
            title: 'Loan application submitted',
            html: `Reference <strong>${reference}</strong><br>Rs. ${this.loanAmount.toLocaleString()} requested against FD ${this.selectedFD.fd_id}.`,
            confirmButtonText: 'Done'
          });

          // Reset form
          this.selectedFD = null as any;
          this.selectedLoan = undefined;
          this.loanAmount = 0;
          this.selectedLoanType = '';
          this.maximumLoanAmount = 0;
          this.duration = null;
          this.interest = null;

          // Reload loans
          this.loadLoans();
        },
        error: (err) => {
          console.error('Error applying loan:', err);
          this.errorMessage = err?.error?.message || err?.message || 'Failed to apply for loan';
          this.isProcessingLoan = false;

          this.toastService.error('Loan application failed', this.errorMessage);
        }
      });

      this.subscriptions.push(sub);
    } catch (error) {
      console.error('Error processing loan application:', error);
      this.toastService.error('Loan application failed', 'Failed to process loan application.');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
