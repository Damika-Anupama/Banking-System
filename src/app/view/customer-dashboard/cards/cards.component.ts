import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';
import { demoStore } from 'src/app/shared/demo-store';

@Component({
  selector: 'app-cards',
  standalone: false,
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss']
})
export class CardsComponent implements OnInit {
  cards: any[] = [];

  /** True while the cards are being read into the view. */
  isLoading = true;

  /** Rough shape of the card grid so the loading skeleton holds the layout. */
  readonly cardSkeletonColumns = ['Card', 'Balance', 'Status'];

  constructor(private cdr: ChangeDetectorRef, private toastService: ToastService) {}

  ngOnInit(): void {
    // The demo store resolves synchronously, but the flag keeps the page on the
    // same skeleton-while-loading pattern as home/loans if a real API lands here.
    this.isLoading = true;
    this.cards = demoStore.getCards();
    this.isLoading = false;
  }

  get activeCount(): number {
    return this.cards.filter(c => c.status === 'Active').length;
  }

  get frozenCount(): number {
    return this.cards.filter(c => c.status === 'Frozen').length;
  }

  availableCredit(card: any): number {
    return Number(card.credit_limit || 0) - Number(card.credit_used || 0);
  }

  creditUsedPct(card: any): number {
    if (!card.credit_limit) return 0;
    return Math.min(100, Math.round((Number(card.credit_used || 0) / Number(card.credit_limit)) * 100));
  }

  /** Tailwind bg class for the credit-utilization bar, by health tier. */
  creditBarClass(card: any): string {
    const pct = this.creditUsedPct(card);
    if (pct >= 70) return 'bg-rose-400';
    if (pct >= 30) return 'bg-amber-400';
    return 'bg-emerald-400';
  }

  /** Short utilization health label shown next to the bar. */
  creditUtilizationLabel(card: any): string {
    const pct = this.creditUsedPct(card);
    if (pct >= 70) return 'High utilization';
    if (pct >= 30) return 'Moderate utilization';
    return 'Healthy utilization';
  }

  creditLabelClass(card: any): string {
    const pct = this.creditUsedPct(card);
    if (pct >= 70) return 'text-rose-200';
    if (pct >= 30) return 'text-amber-200';
    return 'text-emerald-200';
  }

  cardGradient(card: any): string {
    if (card.status === 'Frozen') return 'from-slate-600 to-slate-700';
    return card.type === 'Credit' ? 'from-violet-600 to-indigo-700' : 'from-blue-600 to-cyan-600';
  }

  toggleFreeze(card: any): void {
    const freezing = card.status === 'Active';
    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      icon: 'question',
      title: freezing ? 'Freeze card?' : 'Unfreeze card?',
      html: freezing
        ? `Temporarily block all transactions on •••• ${card.number_last4}?`
        : `Re-enable transactions on •••• ${card.number_last4}?`,
      showCancelButton: true,
      confirmButtonText: freezing ? 'Freeze card' : 'Unfreeze card',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (result.isConfirmed) {
        demoStore.toggleCardFreeze(card.id);
        this.cards = [...demoStore.getCards()];
        this.cdr.detectChanges();
        this.toastService.success(
          freezing ? 'Card frozen' : 'Card unfrozen',
          `•••• ${card.number_last4}`
        );
      }
    });
  }
}
