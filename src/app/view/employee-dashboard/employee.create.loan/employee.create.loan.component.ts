import { Component } from '@angular/core';
import { loanPackage } from 'src/app/model/LoanPackage';

/**
 * NOTE: This component requires full implementation.
 *
 * Required error handling implementation:
 * - Add OnDestroy implementation
 * - Add subscription management with Subscription[] array
 * - Add loading state (isLoading: boolean)
 * - Add error message property (errorMessage: string)
 * - Add null/undefined checks for all data operations
 * - Add form validation for customer ID and loan amount
 * - Add try-catch blocks in proceed() method
 * - Add ngOnDestroy() with subscription cleanup
 * - Add SweetAlert2 error handling for all API calls
 * - Implement proper error messages for API failures
 */

@Component({
  selector: 'app-employee.create.loan',
  standalone: false,
  templateUrl: './employee.create.loan.component.html',
  styleUrls: ['./employee.create.loan.component.scss']
})
export class EmployeeCreateLoanComponent {
  customerID: string = '';
  loans: any;
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
  constructor() { }


  onLoanSelected() {
    for (const element of this.packageArray) {
      if (element.index === Number(this.selectedLoan)) {
        this.duration = element.period;
        this.interest = element.interest;
      }
    }
  }
  proceed(){
    // TODO: Implement loan creation with comprehensive error handling
  }
}
