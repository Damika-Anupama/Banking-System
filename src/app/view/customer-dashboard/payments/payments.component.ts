import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';
import { demoStore } from 'src/app/shared/demo-store';
import { createDemoStandingOrder } from 'src/app/shared/demo-banking-fixtures';
import { focusFirstError } from 'src/app/shared/focus-first-error';
import { localIsoToday } from 'src/app/shared/local-date';

@Component({
  selector: 'app-payments',
  standalone: false,
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss']
})
export class PaymentsComponent implements OnInit {
  constructor(private toastService: ToastService) {}

  orders: any[] = [];

  // Form
  payee = '';
  accountId = '';
  category = 'Utilities';
  amount: number | null = null;
  frequency: 'Monthly' | 'Weekly' | 'Quarterly' = 'Monthly';
  nextDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  isSaving = false;
  touched: Record<string, boolean> = {};

  readonly categories = ['Utilities', 'Rent / lease', 'Insurance', 'Subscription', 'Tax / government', 'Other'];
  readonly frequencies: ('Monthly' | 'Weekly' | 'Quarterly')[] = ['Monthly', 'Weekly', 'Quarterly'];
  private readonly validatedFields = ['payee', 'accountId', 'amount', 'nextDate'];

  get todayIso(): string {
    return localIsoToday();
  }

  ngOnInit(): void {
    this.orders = demoStore.getStandingOrders();
  }

  get activeOrders(): any[] {
    return this.orders.filter(o => o.status === 'Active');
  }

  get monthlyCommitted(): number {
    return this.activeOrders.reduce((sum, o) => {
      const monthly = o.frequency === 'Weekly' ? o.amount * 4 : o.frequency === 'Quarterly' ? o.amount / 3 : o.amount;
      return sum + Math.round(monthly);
    }, 0);
  }

  get nextPayment(): any | null {
    return [...this.activeOrders]
      .sort((a, b) => new Date(a.next_date).getTime() - new Date(b.next_date).getTime())[0] || null;
  }

  get fieldErrors(): Record<string, string | null> {
    const amount = Number(this.amount);
    const account = this.accountId.trim().toUpperCase();

    return {
      payee: this.payee.trim() ? null : 'Enter the payee name.',

      accountId: !account
        ? 'Enter the payee account number.'
        : !/^ACC-?\d{6,}$/.test(account)
          ? 'Use a valid account format, such as ACC-880021.'
          : null,

      amount: !this.amount
        ? 'Enter an amount.'
        : !Number.isFinite(amount) || amount <= 0
          ? 'Enter a valid positive amount.'
          : null,

      nextDate: !this.nextDate
        ? 'Choose the first payment date.'
        : this.nextDate < this.todayIso
          ? 'The first payment cannot be in the past.'
          : null,
    };
  }

  get isValid(): boolean {
    return this.validatedFields.every(field => !this.fieldErrors[field]);
  }

  /** The first field the form rejected, so focus can be sent straight to it. */
  get firstErrorField(): string | null {
    for (const field of this.validatedFields) {
      if (this.fieldErrors[field]) return field;
    }
    return null;
  }

  /** An error is only shown once the user has left the field, to avoid nagging mid-type. */
  errorFor(field: string): string | null {
    return this.touched[field] ? this.fieldErrors[field] : null;
  }

  markTouched(field: string): void {
    this.touched[field] = true;
  }

  /** Whole days from today until the order's next payment date (negative = overdue). */
  private daysUntil(dateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Parse the YYYY-MM-DD as LOCAL date parts; `new Date('YYYY-MM-DD')` would
    // parse as UTC midnight and shift the day by one in negative-UTC timezones.
    const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
    const target = new Date(y, (m || 1) - 1, d || 1);
    return Math.round((target.getTime() - today.getTime()) / 86400000);
  }

  /** Human-friendly urgency label for the next payment date. */
  dueLabel(order: any): string {
    if (order.status !== 'Active') return 'Paused';
    const days = this.daysUntil(order.next_date);
    if (days < 0) return `Overdue by ${Math.abs(days)}d`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  }

  /** Tone class for the urgency label. */
  dueClass(order: any): string {
    if (order.status !== 'Active') return 'text-white/40';
    const days = this.daysUntil(order.next_date);
    if (days < 0) return 'text-rose-300';
    if (days <= 2) return 'text-amber-300';
    return 'text-emerald-300';
  }

  setUpOrder(): void {
    if (!this.isValid) {
      this.validatedFields.forEach(field => (this.touched[field] = true));
      focusFirstError(this.firstErrorField);
      this.toastService.error('Check the order details', 'Fix the highlighted fields to schedule the payment.');
      return;
    }
    this.isSaving = true;
    const order = createDemoStandingOrder({
      payee: this.payee.trim(),
      account_id: this.accountId.trim(),
      category: this.category,
      amount: Number(this.amount),
      frequency: this.frequency,
      next_date: this.nextDate
    });
    demoStore.addStandingOrder(order);
    this.orders = demoStore.getStandingOrders();

    setTimeout(() => {
      this.isSaving = false;
      this.toastService.success(
        'Standing order created',
        `${order.payee} · Rs. ${order.amount.toLocaleString()} ${order.frequency.toLowerCase()}`
      );
      this.resetForm();
    }, 400);
  }

  toggleOrder(order: any): void {
    demoStore.toggleStandingOrder(order.id);
    this.orders = demoStore.getStandingOrders();
  }

  cancelOrder(order: any): void {
    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      icon: 'warning',
      title: 'Cancel standing order?',
      html: `Stop the recurring payment to <strong>${order.payee}</strong>?`,
      showCancelButton: true,
      confirmButtonText: 'Cancel order',
      cancelButtonText: 'Keep it'
    }).then(result => {
      if (result.isConfirmed) {
        demoStore.removeStandingOrder(order.id);
        this.orders = demoStore.getStandingOrders();
        this.toastService.success('Order cancelled');
      }
    });
  }

  private resetForm(): void {
    this.payee = '';
    this.accountId = '';
    this.category = 'Utilities';
    this.amount = null;
    this.frequency = 'Monthly';
    this.nextDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    // A fresh form should not open covered in last submission's error marks.
    this.touched = {};
  }
}
