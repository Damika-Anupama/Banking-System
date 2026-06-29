import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { demoStore } from 'src/app/shared/demo-store';
import { createDemoStandingOrder } from 'src/app/shared/demo-banking-fixtures';

@Component({
  selector: 'app-payments',
  standalone: false,
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss']
})
export class PaymentsComponent implements OnInit {
  orders: any[] = [];

  // Form
  payee = '';
  accountId = '';
  category = 'Utilities';
  amount: number | null = null;
  frequency: 'Monthly' | 'Weekly' | 'Quarterly' = 'Monthly';
  nextDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  isSaving = false;

  readonly categories = ['Utilities', 'Rent / lease', 'Insurance', 'Subscription', 'Tax / government', 'Other'];
  readonly frequencies: ('Monthly' | 'Weekly' | 'Quarterly')[] = ['Monthly', 'Weekly', 'Quarterly'];

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

  get isValid(): boolean {
    return Boolean(this.payee.trim() && this.accountId.trim() && this.amount && this.amount > 0 && this.nextDate);
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
      Swal.fire({ icon: 'error', title: 'Validation error', text: 'Fill payee, account, amount, and next date.' });
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
      Swal.fire({
        icon: 'success',
        title: 'Standing order created',
        html: `<strong>${order.payee}</strong> · Rs. ${order.amount.toLocaleString()} ${order.frequency.toLowerCase()}`,
        timer: 1800,
        showConfirmButton: false
      });
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
        Swal.fire({ icon: 'success', title: 'Order cancelled', timer: 1400, showConfirmButton: false });
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
  }
}
