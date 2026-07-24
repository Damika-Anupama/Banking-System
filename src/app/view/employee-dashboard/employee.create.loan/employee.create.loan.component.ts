import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { loanPackage } from 'src/app/model/LoanPackage';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';
import { focusFirstError } from 'src/app/shared/focus-first-error';
import { demoStore } from 'src/app/shared/demo-store';
import { createDemoLoanApplication } from 'src/app/shared/demo-banking-fixtures';

@Component({
  selector: 'app-employee.create.loan',
  standalone: false,
  templateUrl: './employee.create.loan.component.html',
  styleUrls: ['./employee.create.loan.component.scss']
})
export class EmployeeCreateLoanComponent implements OnInit {
  customers: any[] = [];
  customerID = '';
  loanAmount: number | null = null;
  selectedLoan: number | undefined;
  packageArray: loanPackage[] = [
    { index: 1, period: '6 months', interest: '13%' },
    { index: 2, period: '1 year', interest: '14%' },
    { index: 3, period: '3 years', interest: '15%' },
  ];
  duration: any;
  interest: any;
  selectedLoanType = 'Personal';
  purpose = '';
  isProcessing = false;

  constructor(private router: Router, private toastService: ToastService) { }

  ngOnInit(): void {
    this.customers = demoStore.getCustomers();
  }

  get selectedCustomer(): any | null {
    return this.customers.find(c => String(c.user_id) === String(this.customerID)) || null;
  }

  get durationInDays(): number {
    return this.duration === '6 months' ? 180 : this.duration === '1 year' ? 360 : this.duration === '3 years' ? 1080 : 0;
  }

  get estimatedMonthlyPayment(): number {
    const months = Math.max(1, Math.round(this.durationInDays / 30));
    const principal = Number(this.loanAmount || 0);
    const annualRate = Number(String(this.interest || '0').replace('%', '')) / 100;
    if (!principal) return 0;
    return Math.round((principal + principal * annualRate * (this.durationInDays / 365)) / months);
  }

  get isValid(): boolean {
    return Boolean(this.customerID && this.loanAmount && this.loanAmount > 0 && this.selectedLoan && this.selectedLoanType);
  }

  /** Fields the user has left, so errors appear on blur rather than while typing. */
  touched: Record<string, boolean> = {};

  private readonly validatedFields = ['customerID', 'loanAmount', 'selectedPackage'];

  /**
   * Single source of truth for application validity, so a rule cannot be
   * enforced on submit but left invisible on the field that broke it.
   * (Loan type always holds a value — the radios default to Personal.)
   */
  get fieldErrors(): Record<string, string | null> {
    return {
      customerID: this.customerID ? null : 'Select a customer.',

      loanAmount: !this.loanAmount || this.loanAmount <= 0
        ? 'Enter a loan amount above zero.'
        : null,

      selectedPackage: this.selectedLoan ? null : 'Select a payment plan.',
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

  onLoanSelected(): void {
    const pkg = this.packageArray.find(p => p.index === Number(this.selectedLoan));
    this.duration = pkg?.period ?? null;
    this.interest = pkg?.interest ?? null;
  }

  async proceed(): Promise<void> {
    // Surface every problem at once, against the field that caused it.
    this.markAllTouched();

    if (this.hasFieldErrors) {
      this.toastService.error('Check the highlighted fields', this.firstFieldError ?? undefined);
      focusFirstError(this.firstErrorField);
      return;
    }

    const customer = this.selectedCustomer;
    const amount = Number(this.loanAmount);
    const rate = Number(String(this.interest).replace('%', ''));

    const confirmation = await Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      icon: 'question',
      title: 'Submit loan to manager',
      html: `
        <div class="demo-detail-grid">
          <div class="demo-detail-row"><span>Customer</span><strong>${customer?.fullname || this.customerID}</strong></div>
          <div class="demo-detail-row"><span>Amount</span><strong>Rs. ${amount.toLocaleString()}</strong></div>
          <div class="demo-detail-row"><span>Term</span><strong>${this.duration}</strong></div>
          <div class="demo-detail-row"><span>Rate</span><strong>${this.interest} p.a.</strong></div>
          <div class="demo-detail-row"><span>Type</span><strong>${this.selectedLoanType}</strong></div>
          <div class="demo-detail-row"><span>Est. monthly</span><strong>Rs. ${this.estimatedMonthlyPayment.toLocaleString()}</strong></div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Submit to manager',
      cancelButtonText: 'Review again'
    });

    if (!confirmation.isConfirmed) return;

    this.isProcessing = true;
    const application = createDemoLoanApplication({
      customer_id: customer?.user_id || this.customerID,
      amount,
      duration_days: this.durationInDays,
      interest: rate,
      loan_type: this.selectedLoanType,
      purpose: this.purpose.trim()
    });
    demoStore.addLoanApplication(application);

    setTimeout(() => {
      this.isProcessing = false;
      Swal.fire({
        icon: 'success',
        title: 'Loan submitted for approval',
        html: `Reference <strong>${application.loan_basic_detail_id}</strong><br>Sent to the branch manager's approval queue.`,
        confirmButtonText: 'Done'
      }).then(() => this.resetForm());
    }, 500);
  }

  private resetForm(): void {
    this.customerID = '';
    this.loanAmount = null;
    this.selectedLoan = undefined;
    this.selectedLoanType = 'Personal';
    this.purpose = '';
    this.duration = null;
    this.interest = null;
    // The cleared fields would all read as errors if they stayed "touched".
    this.touched = {};
  }
}
