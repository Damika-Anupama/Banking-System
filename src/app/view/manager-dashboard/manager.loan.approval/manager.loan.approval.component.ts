import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoanApprovalService } from 'src/app/service/manager/loan.approval.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { demoStore } from 'src/app/shared/demo-store';
import { ToastService } from 'src/app/service/toast.service';
import { TableSort } from 'src/app/shared/table-sort';

@Component({
  selector: 'app-manager.loan.approval',
  standalone: false,
  templateUrl: './manager.loan.approval.component.html',
  styleUrls: ['./manager.loan.approval.component.scss']
})
export class ManagerLoanApprovalComponent implements OnInit, OnDestroy {
  loans: any[] | null = null;
  searchTerm = '';
  approvedCount = 0;
  rejectedCount = 0;
  isLoading = false;
  errorMessage = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private loanService: LoanApprovalService,
    private toastService: ToastService
  ) { }

  get decidedCount(): number {
    return this.approvedCount + this.rejectedCount;
  }

  /** Remove a decided loan from the local list (store already updated). */
  private removeFromList(loanId: any): void {
    this.loans = (this.loans || []).filter(
      (l) => String(l.loan_basic_detail_id) !== String(loanId)
    );
  }

  /** Sortable columns for the approval queue. */
  readonly sort = new TableSort<any>({
    amount: (l) => Number(l?.amount || 0),
    interest: (l) => Number(l?.interest || 0),
    duration: (l) => Number(l?.duration_days || 0),
    customer: (l) => String(l?.customer_id || '').toLowerCase(),
  });

  toggleSort(column: string): void {
    this.sort.toggle(column);
    // Reordering restarts pagination so the new first rows are visible.
    this.loanPage = 1;
  }

  get filteredLoans(): any[] {
    const list = this.loans || [];
    const q = this.searchTerm.trim().toLowerCase();
    const matched = !q
      ? list
      : list.filter((l: any) =>
          [l.loan_basic_detail_id, l.customer_id, l.loan_type, String(l.amount)]
            .some(v => v && String(v).toLowerCase().includes(q))
        );

    return this.sort.apply(matched);
  }

  /** Mirrors the queue's headers so the loading skeleton holds the layout. */
  readonly loanSkeletonColumns = ['Loan ID', 'Customer', 'Amount', 'Type', 'Action'];

  // ----- Pagination (clamped getters, same shape as the customer loan table) -----
  loanPage = 1;
  readonly loanPageSize = 5;

  get loanCount(): number {
    return this.filteredLoans.length;
  }

  get totalLoanPages(): number {
    return Math.max(1, Math.ceil(this.loanCount / this.loanPageSize));
  }

  get pagedLoans(): any[] {
    const page = Math.min(this.loanPage, this.totalLoanPages);
    const start = (page - 1) * this.loanPageSize;
    return this.filteredLoans.slice(start, start + this.loanPageSize);
  }

  get loanRangeStart(): number {
    return this.loanCount === 0
      ? 0
      : (Math.min(this.loanPage, this.totalLoanPages) - 1) * this.loanPageSize + 1;
  }

  get loanRangeEnd(): number {
    return Math.min(this.loanRangeStart + this.loanPageSize - 1, this.loanCount);
  }

  setLoanPage(page: number): void {
    this.loanPage = Math.max(1, Math.min(page, this.totalLoanPages));
  }

  /** A new search starts back at page 1 so matches are never hidden off-page. */
  onSearchChange(): void {
    this.loanPage = 1;
  }

  get pendingCount(): number {
    return Array.isArray(this.loans) ? this.loans.length : 0;
  }

  get totalRequestedAmount(): number {
    if (!Array.isArray(this.loans)) return 0;
    return this.loans.reduce((sum: number, l: any) => sum + Number(l?.amount || 0), 0);
  }

  get averageInterest(): number {
    if (!Array.isArray(this.loans) || this.loans.length === 0) return 0;
    const total = this.loans.reduce((sum: number, l: any) => sum + Number(l?.interest || 0), 0);
    return Math.round((total / this.loans.length) * 10) / 10;
  }

  ngOnInit(): void {
    this.loadUnapprovedLoans();
  }

  loadUnapprovedLoans(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const sub = this.loanService.getUnapprovedLoans().subscribe({
      next: (data) => {
        try {
          // Null/undefined checks
          if (!data) {
            this.errorMessage = 'No data received from server';
            this.isLoading = false;
            this.toastService.error('Could not load loans', this.errorMessage);
            return;
          }

          // Check if data.data exists and is an array
          if (!data.data || !Array.isArray(data.data)) {
            this.errorMessage = 'Invalid data format received';
            this.loans = [];
            this.isLoading = false;
            this.toastService.warning('No loan data', 'No loan data available.');
            return;
          }

          this.loans = data.data;
          this.isLoading = false;
        } catch (error) {
          console.error('Error processing loan data:', error);
          this.errorMessage = 'Failed to process loan data';
          this.isLoading = false;
          this.toastService.error('Could not load loans', this.errorMessage);
        }
      },
      error: (err) => {
        console.error('Error loading unapproved loans:', err);
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load unapproved loans';
        this.isLoading = false;

        this.toastService.error('Could not load loans', this.errorMessage);
      }
    });

    this.subscriptions.push(sub);
  }

  showLoanDetails(loan: any): void {
    if (!loan) {
      return;
    }

    const customer = demoStore.getCustomers().find(
      (c) => String(c.user_id) === String(loan.customer_id)
    );
    const amount = Number(loan.amount || 0);
    const totalRepayable = Math.round(
      amount * (1 + (Number(loan.interest || 0) / 100) * (Number(loan.duration_days || 0) / 365))
    );

    const customerRows = customer
      ? `
          <div class="demo-detail-row"><span>Applicant</span><strong>${customer.fullname}</strong></div>
          <div class="demo-detail-row"><span>Contact</span><strong>${customer.contact_no || 'N/A'}</strong></div>
          <div class="demo-detail-row"><span>KYC status</span><strong>${customer.status || 'N/A'}</strong></div>
          <div class="demo-detail-row"><span>Linked accounts</span><strong>${customer.account_count ?? 'N/A'}</strong></div>`
      : `<div class="demo-detail-row"><span>Applicant</span><strong>${loan.customer_id || 'N/A'}</strong></div>`;

    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      title: loan.loan_basic_detail_id || 'Loan application',
      html: `
        <div class="demo-detail-grid">
          ${customerRows}
          <div class="demo-detail-row"><span>Customer ID</span><strong>${loan.customer_id || 'N/A'}</strong></div>
          <div class="demo-detail-row"><span>Amount</span><strong>Rs. ${amount.toLocaleString()}</strong></div>
          <div class="demo-detail-row"><span>Term</span><strong>${loan.duration_days || 'N/A'} days</strong></div>
          <div class="demo-detail-row"><span>Interest</span><strong>${loan.interest || 'N/A'}% p.a.</strong></div>
          <div class="demo-detail-row"><span>Type</span><strong>${loan.loan_type || 'N/A'}</strong></div>
          <div class="demo-detail-row"><span>Purpose</span><strong>${loan.purpose || 'Not specified'}</strong></div>
          <div class="demo-detail-row"><span>Total repayable</span><strong>Rs. ${totalRepayable.toLocaleString()}</strong></div>
          <div class="demo-detail-row"><span>Status</span><strong>${loan.status || 'Pending'}</strong></div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Approve',
      denyButtonText: 'Reject',
      cancelButtonText: 'Close'
    }).then((result) => {
      if (result.isConfirmed) {
        this.approve(loan.loan_basic_detail_id);
      } else if (result.isDenied) {
        this.reject(loan.loan_basic_detail_id);
      }
    });
  }

  approve(loanId?: any): void {
    // Null/undefined check for loanId
    if (!loanId) {
      this.toastService.error('Cannot proceed', 'Loan ID is missing.');
      return;
    }

    // Show confirmation dialog
    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      title: 'Approve Loan',
      text: 'Are you sure you want to approve this loan?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.processApproval(loanId);
      }
    });
  }

  /** Human-readable audit detail for a loan decision, e.g. the seed format. */
  private loanAuditDetail(loanId: any): string {
    const loan = (this.loans || []).find(
      (l) => String(l.loan_basic_detail_id) === String(loanId)
    );
    if (!loan) return String(loanId);
    const amount = Number(loan.amount || 0).toLocaleString();
    return `${loanId} · Rs. ${amount} ${loan.loan_type || ''} loan for ${loan.customer_id || 'customer'}`.replace(/\s+/g, ' ').trim();
  }

  private processApproval(loanId: any): void {
    const detail = this.loanAuditDetail(loanId);
    demoStore.removeLoanApplication(loanId);
    demoStore.recordAudit({ category: 'Loan', action: 'Loan approved', detail, outcome: 'Approved' });
    this.removeFromList(loanId);
    this.approvedCount++;
    // The row leaving the queue is the real feedback; the toast just names it.
    this.toastService.success(
      'Loan approved',
      `Loan ${loanId} has been approved and removed from the queue.`
    );
  }

  reject(loanId?: any): void {
    // Null/undefined check for loanId
    if (!loanId) {
      this.toastService.error('Cannot proceed', 'Loan ID is missing.');
      return;
    }

    // Show confirmation dialog with reason input
    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      title: 'Reject Loan',
      text: 'Are you sure you want to reject this loan?',
      input: 'textarea',
      inputLabel: 'Rejection Reason',
      inputPlaceholder: 'Enter reason for rejection...',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Please provide a reason for rejection';
        }
        return null;
      },
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, reject it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.processRejection(loanId, result.value);
      }
    });
  }

  private processRejection(loanId: any, reason: string): void {
    const detail = `${this.loanAuditDetail(loanId)} — ${reason}`;
    demoStore.removeLoanApplication(loanId);
    demoStore.recordAudit({ category: 'Loan', action: 'Loan rejected', detail, outcome: 'Rejected' });
    this.removeFromList(loanId);
    this.rejectedCount++;
    this.toastService.success('Loan rejected', `Loan ${loanId} has been rejected. Reason: ${reason}`);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
