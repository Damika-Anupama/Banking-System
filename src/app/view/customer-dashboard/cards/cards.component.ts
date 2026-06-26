import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { demoStore } from 'src/app/shared/demo-store';

@Component({
  selector: 'app-cards',
  standalone: false,
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss']
})
export class CardsComponent implements OnInit {
  cards: any[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cards = demoStore.getCards();
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
        Swal.fire({
          icon: 'success',
          title: freezing ? 'Card frozen' : 'Card unfrozen',
          timer: 1400,
          showConfirmButton: false
        });
      }
    });
  }
}
