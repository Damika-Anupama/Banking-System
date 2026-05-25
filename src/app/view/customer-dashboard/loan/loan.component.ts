import { Component, OnInit, OnDestroy } from '@angular/core';
import { fd } from 'src/app/model/FD';
import { loanPackage } from 'src/app/model/LoanPackage';
import { LoanService } from 'src/app/service/customer/loan.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

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

  isLoadingFDs = false;
  isLoadingLoans = false;
  isProcessingLoan = false;
  errorMessage = '';
  private subscriptions: Subscription[] = [];

  constructor(private loanService: LoanService) {}

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
          Swal.fire({
            icon: 'warning',
            title: 'No Fixed Deposits',
            text: 'You do not have any fixed deposits available for loan application.'
          });
          return;
        }

        this.fds = Array.isArray(data.data) ? data.data : [];
        this.isLoadingFDs = false;

        if (this.fds.length === 0) {
          Swal.fire({
            icon: 'info',
            title: 'No Fixed Deposits',
            text: 'You need to create a fixed deposit before applying for a loan.'
          });
        }
      },
      error: (err) => {
        console.error('Error loading FDs:', err);
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load fixed deposits';
        this.isLoadingFDs = false;
        this.fds = [];

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.errorMessage
        });
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

  onFDSelected() {
    // Null check for selectedFD
    if (!this.selectedFD || !this.selectedFD.amount || !this.selectedFD.fd_id) {
      this.maximumLoanAmount = 0;
      Swal.fire({
        icon: 'error',
        title: 'Invalid Selection',
        text: 'Please select a valid fixed deposit'
      });
      return;
    }

    try {
      const fdAmount = Number(this.selectedFD.amount);

      if (isNaN(fdAmount) || fdAmount <= 0) {
        this.maximumLoanAmount = 0;
        Swal.fire({
          icon: 'error',
          title: 'Invalid Amount',
          text: 'Selected fixed deposit has an invalid amount'
        });
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
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to calculate maximum loan amount'
      });
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
    if (!this.loanAmount || this.loanAmount <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Amount',
        text: 'Please enter a valid loan amount'
      });
      return;
    }

    if (this.loanAmount > this.maximumLoanAmount) {
      Swal.fire({
        icon: 'error',
        title: 'Amount Exceeds Limit',
        text: `Loan amount should be less than or equal to maximum loan amount (${this.maximumLoanAmount.toFixed(2)})`
      });
    }
  }

  async proceed() {
    // Form validation
    if (!this.selectedFD || !this.selectedLoan || !this.loanAmount || !this.selectedLoanType) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please select all the fields (FD, Loan Package, Amount, Loan Type)'
      });
      return;
    }

    // Validate loan amount
    if (this.loanAmount <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Amount',
        text: 'Please enter a valid positive loan amount'
      });
      return;
    }

    // Validate loan amount doesn't exceed maximum
    if (this.loanAmount > this.maximumLoanAmount) {
      Swal.fire({
        icon: 'error',
        title: 'Amount Exceeds Limit',
        text: `Loan amount should be less than or equal to ${this.maximumLoanAmount.toFixed(2)}`
      });
      return;
    }

    // Validate user ID exists
    const userId = localStorage.getItem("userId") || (localStorage.getItem('demoMode') === 'true' ? 'CUS-1001' : null);
    if (!userId) {
      Swal.fire({
        icon: 'error',
        title: 'Authentication Error',
        text: 'User ID not found. Please log in again.'
      });
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
          Swal.fire({
            icon: 'error',
            title: 'Invalid Interest',
            text: 'Please select a valid loan package'
          });
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
          Swal.fire({
            icon: 'error',
            title: 'Invalid Duration',
            text: 'Please select a valid loan package'
          });
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

          Swal.fire({
            icon: 'error',
            title: 'Loan Application Failed',
            text: this.errorMessage
          });
        }
      });

      this.subscriptions.push(sub);
    } catch (error) {
      console.error('Error processing loan application:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to process loan application'
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
