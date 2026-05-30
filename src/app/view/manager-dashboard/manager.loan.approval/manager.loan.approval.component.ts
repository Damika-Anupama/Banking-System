import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoanApprovalService } from 'src/app/service/manager/loan.approval.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { demoStore } from 'src/app/shared/demo-store';

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

  constructor(private loanService: LoanApprovalService) { }

  get decidedCount(): number {
    return this.approvedCount + this.rejectedCount;
  }

  /** Remove a decided loan from the local list (store already updated). */
  private removeFromList(loanId: any): void {
    this.loans = (this.loans || []).filter(
      (l) => String(l.loan_basic_detail_id) !== String(loanId)
    );
  }

  get filteredLoans(): any[] {
    const list = this.loans || [];
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter((l: any) =>
      [l.loan_basic_detail_id, l.customer_id, l.loan_type, String(l.amount)]
        .some(v => v && String(v).toLowerCase().includes(q))
    );
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
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: this.errorMessage
            });
            return;
          }

          // Check if data.data exists and is an array
          if (!data.data || !Array.isArray(data.data)) {
            this.errorMessage = 'Invalid data format received';
            this.loans = [];
            this.isLoading = false;
            Swal.fire({
              icon: 'warning',
              title: 'Warning',
              text: 'No loan data available'
            });
            return;
          }

          this.loans = data.data;
          this.isLoading = false;

          // Show message if no loans found
          if (this.loans && this.loans.length === 0) {
            Swal.fire({
              icon: 'info',
              title: 'No Pending Loans',
              text: 'There are no pending loan approvals at this time'
            });
          }
        } catch (error) {
          console.error('Error processing loan data:', error);
          this.errorMessage = 'Failed to process loan data';
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.errorMessage
          });
        }
      },
      error: (err) => {
        console.error('Error loading unapproved loans:', err);
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load unapproved loans';
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

  showLoanDetails(loan: any): void {
    if (!loan) {
      return;
    }

    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      title: loan.loan_basic_detail_id || 'Loan application',
      html: `
        <div class="demo-detail-grid">
          <div class="demo-detail-row"><span>Customer</span><strong>${loan.customer_id || 'N/A'}</strong></div>
          <div class="demo-detail-row"><span>Amount</span><strong>Rs. ${Number(loan.amount || 0).toLocaleString()}</strong></div>
          <div class="demo-detail-row"><span>Duration</span><strong>${loan.duration_days || 'N/A'} days</strong></div>
          <div class="demo-detail-row"><span>Interest</span><strong>${loan.interest || 'N/A'}%</strong></div>
          <div class="demo-detail-row"><span>Type</span><strong>${loan.loan_type || 'N/A'}</strong></div>
          <div class="demo-detail-row"><span>Purpose</span><strong>${loan.purpose || 'Not specified'}</strong></div>
          <div class="demo-detail-row"><span>Status</span><strong>${loan.status || 'Pending'}</strong></div>
        </div>
      `,
      icon: 'question',
      confirmButtonText: 'Close'
    });
  }

  approve(loanId?: any): void {
    // Null/undefined check for loanId
    if (!loanId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Loan ID is missing'
      });
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

  private processApproval(loanId: any): void {
    demoStore.removeLoanApplication(loanId);
    this.removeFromList(loanId);
    this.approvedCount++;
    Swal.fire({
      icon: 'success',
      title: 'Loan approved',
      html: `Loan <strong>${loanId}</strong> has been approved and removed from the queue.`,
      confirmButtonText: 'Done'
    });
  }

  reject(loanId?: any): void {
    // Null/undefined check for loanId
    if (!loanId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Loan ID is missing'
      });
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
    demoStore.removeLoanApplication(loanId);
    this.removeFromList(loanId);
    this.rejectedCount++;
    Swal.fire({
      icon: 'success',
      title: 'Loan rejected',
      html: `Loan <strong>${loanId}</strong> has been rejected.<br><span class="text-sm">Reason: ${reason}</span>`,
      confirmButtonText: 'Done'
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
