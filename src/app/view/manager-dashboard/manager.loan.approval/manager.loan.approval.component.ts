import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoanApprovalService } from 'src/app/service/manager/loan.approval.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-manager.loan.approval',
  standalone: false,
  templateUrl: './manager.loan.approval.component.html',
  styleUrls: ['./manager.loan.approval.component.scss']
})
export class ManagerLoanApprovalComponent implements OnInit, OnDestroy {
  loans: any[] | null = null;
  isLoading = false;
  errorMessage = '';
  private subscriptions: Subscription[] = [];

  constructor(private loanService: LoanApprovalService) { }

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
      title: loan.loan_basic_detail_id || 'Loan application',
      html: `
        <div style="text-align:left;line-height:1.8">
          <strong>Customer:</strong> ${loan.customer_id || 'N/A'}<br>
          <strong>Amount:</strong> Rs. ${Number(loan.amount || 0).toLocaleString()}<br>
          <strong>Duration:</strong> ${loan.duration_days || 'N/A'} days<br>
          <strong>Interest:</strong> ${loan.interest || 'N/A'}%<br>
          <strong>Type:</strong> ${loan.loan_type || 'N/A'}<br>
          <strong>Purpose:</strong> ${loan.purpose || 'Not specified'}<br>
          <strong>Status:</strong> ${loan.status || 'Pending'}
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
    // TODO: Implement loan approval with API call
    // Example implementation:
    /*
    this.isLoading = true;
    const sub = this.loanService.approveLoan(loanId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (!response) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No response received from server'
          });
          return;
        }
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Loan approved successfully'
        }).then(() => {
          this.loadUnapprovedLoans(); // Refresh the list
        });
      },
      error: (err) => {
        console.error('Error approving loan:', err);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'Failed to approve loan'
        });
      }
    });
    this.subscriptions.push(sub);
    */

    Swal.fire({
      icon: 'warning',
      title: 'Not Implemented',
      text: 'Loan approval functionality needs to be implemented'
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
    // TODO: Implement loan rejection with API call
    // Example implementation:
    /*
    this.isLoading = true;
    const sub = this.loanService.rejectLoan(loanId, reason).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (!response) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No response received from server'
          });
          return;
        }
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Loan rejected successfully'
        }).then(() => {
          this.loadUnapprovedLoans(); // Refresh the list
        });
      },
      error: (err) => {
        console.error('Error rejecting loan:', err);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'Failed to reject loan'
        });
      }
    });
    this.subscriptions.push(sub);
    */

    Swal.fire({
      icon: 'warning',
      title: 'Not Implemented',
      text: 'Loan rejection functionality needs to be implemented'
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
