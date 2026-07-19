import { isoDaysFromNow } from 'src/app/shared/local-date';
import { Component } from '@angular/core';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';
import { demoStore } from 'src/app/shared/demo-store';

interface OpenedAccount {
  account_id: string;
  customer: string;
  product: string;
  holder_type: string;
  opening_balance: number;
  branch: string;
  opened: string;
}

@Component({
  selector: 'app-employee.open-account',
  standalone: false,
  templateUrl: './employee.open-account.component.html',
  styleUrls: ['./employee.open-account.component.scss']
})
export class EmployeeOpenAccountComponent {
  constructor(private toastService: ToastService) {}

  customers: any[] = demoStore.getCustomers();

  customerId = '';
  product: 'Savings' | 'Current' | 'Fixed Deposit' = 'Savings';
  holderType: 'Personal' | 'Organization' = 'Personal';
  openingBalance: number | null = null;
  branch = 'Colombo Main Branch';
  isProcessing = false;

  readonly branches = ['Colombo Main Branch', 'Kandy City Branch', 'Galle Branch', 'Negombo Branch'];
  readonly minimums: Record<string, number> = { 'Savings': 1000, 'Current': 5000, 'Fixed Deposit': 25000 };

  // Seed rows stick to branches the selector actually offers, and to dates
  // near today for the same reason as the deposit/withdrawal desks.
  recentlyOpened: OpenedAccount[] = [
    { account_id: 'ACC-493187', customer: 'Tharushi Silva',  product: 'Savings',       holder_type: 'Personal',     opening_balance: 15000,  branch: 'Kandy City Branch',   opened: `${isoDaysFromNow(-1)}T10:05:00` },
    { account_id: 'ACC-493152', customer: 'Sanjaya Fernando', product: 'Current',       holder_type: 'Organization', opening_balance: 120000, branch: 'Galle Branch',        opened: `${isoDaysFromNow(-2)}T13:40:00` },
    { account_id: 'ACC-493118', customer: 'Amaya Kumari',     product: 'Fixed Deposit', holder_type: 'Personal',     opening_balance: 250000, branch: 'Colombo Main Branch', opened: `${isoDaysFromNow(-3)}T09:15:00` }
  ];

  get selectedCustomer(): any | null {
    return this.customers.find(c => c.user_id === this.customerId) || null;
  }

  get minimumDeposit(): number {
    return this.minimums[this.product] || 0;
  }

  get belowMinimum(): boolean {
    return !!this.openingBalance && this.openingBalance < this.minimumDeposit;
  }

  get isValid(): boolean {
    return !!this.selectedCustomer && !!this.openingBalance && this.openingBalance >= this.minimumDeposit;
  }

  productIcon(product: string): string {
    if (product === 'Fixed Deposit') return 'fa-piggy-bank';
    if (product === 'Current') return 'fa-building-columns';
    return 'fa-wallet';
  }

  openAccount(): void {
    if (!this.selectedCustomer) {
      this.toastService.info('Select a customer', 'Choose the customer this account is for.');
      return;
    }
    if (this.belowMinimum) {
      this.toastService.error(
        'Below minimum',
        `${this.product} accounts require at least Rs. ${this.minimumDeposit.toLocaleString()}.`
      );
      return;
    }
    if (!this.isValid) {
      this.toastService.error('Check the account details', 'Complete all fields to open the account.');
      return;
    }

    const customer = this.selectedCustomer;
    const accountId = 'ACC-' + Math.floor(493200 + Math.random() * 6799);
    const balance = Number(this.openingBalance);
    const product = this.product;
    const branch = this.branch;
    const holderType = this.holderType;

    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      icon: 'question',
      title: 'Confirm new account',
      html: `
        <div class="demo-detail-grid">
          <div class="demo-detail-row"><span>Customer</span><strong>${customer.fullname}</strong></div>
          <div class="demo-detail-row"><span>Product</span><strong>${product}</strong></div>
          <div class="demo-detail-row"><span>Holder type</span><strong>${holderType}</strong></div>
          <div class="demo-detail-row"><span>Opening balance</span><strong>Rs. ${balance.toLocaleString()}</strong></div>
          <div class="demo-detail-row"><span>Branch</span><strong>${branch}</strong></div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Open account',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.isProcessing = true;
      setTimeout(() => {
        customer.account_count = (Number(customer.account_count) || 0) + 1;
        this.recentlyOpened = [
          { account_id: accountId, customer: customer.fullname, product, holder_type: holderType, opening_balance: balance, branch, opened: new Date().toISOString() },
          ...this.recentlyOpened
        ];
        this.customerId = '';
        this.openingBalance = null;
        this.product = 'Savings';
        this.holderType = 'Personal';
        this.isProcessing = false;
        Swal.fire({
          icon: 'success',
          title: 'Account opened',
          html: `New ${product} account <strong>${accountId}</strong> created for ${customer.fullname}.`,
          confirmButtonText: 'Done'
        });
      }, 600);
    });
  }
}
