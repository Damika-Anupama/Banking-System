import { Component } from '@angular/core';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';

interface FdTier {
  term: string;
  rate: number;
  min_amount: number;
}

interface LoanPackage {
  name: string;
  type: 'Personal' | 'Business' | 'Mortgage' | 'Vehicle';
  rate: number;
  max_term_months: number;
  max_amount: number;
  active: boolean;
}

@Component({
  selector: 'app-manager.products',
  standalone: false,
  templateUrl: './manager.products.component.html',
  styleUrls: ['./manager.products.component.scss']
})
export class ManagerProductsComponent {
  constructor(private toastService: ToastService) {}

  fdTiers: FdTier[] = [
    { term: '3 months',  rate: 11.5, min_amount: 25000 },
    { term: '6 months',  rate: 13.0, min_amount: 25000 },
    { term: '1 year',    rate: 14.0, min_amount: 50000 },
    { term: '2 years',   rate: 14.75, min_amount: 100000 },
    { term: '5 years',   rate: 15.5, min_amount: 250000 }
  ];

  loanPackages: LoanPackage[] = [
    { name: 'Personal Flexi',   type: 'Personal', rate: 13.0, max_term_months: 60,  max_amount: 2000000,  active: true },
    { name: 'Business Growth',  type: 'Business', rate: 14.2, max_term_months: 84,  max_amount: 10000000, active: true },
    { name: 'Home Advantage',   type: 'Mortgage', rate: 11.8, max_term_months: 240, max_amount: 25000000, active: true },
    { name: 'Auto Drive',       type: 'Vehicle',  rate: 12.5, max_term_months: 72,  max_amount: 6000000,  active: false }
  ];

  get activePackages(): number { return this.loanPackages.filter(p => p.active).length; }
  get avgFdRate(): number {
    const total = this.fdTiers.reduce((s, t) => s + t.rate, 0);
    return this.fdTiers.length ? Math.round((total / this.fdTiers.length) * 100) / 100 : 0;
  }
  get topFdRate(): number {
    return Math.max(...this.fdTiers.map(t => t.rate), 0);
  }
  get lowestLoanRate(): number {
    const active = this.loanPackages.filter(p => p.active);
    return active.length ? Math.min(...active.map(p => p.rate)) : 0;
  }

  typeTone(type: string): string {
    switch (type) {
      case 'Business': return 'bg-gradient-to-r from-glass-cyan/80 to-glass-blue/80';
      case 'Mortgage': return 'bg-gradient-to-r from-glass-emerald/80 to-glass-cyan/80';
      case 'Vehicle': return 'bg-gradient-to-r from-amber-400/80 to-orange-500/80';
      default: return 'bg-gradient-to-r from-glass-purple/80 to-glass-pink/80';
    }
  }

  async editFdRate(tier: FdTier): Promise<void> {
    const result = await Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      title: `Edit ${tier.term} rate`,
      input: 'number',
      inputLabel: 'Annual rate (%)',
      inputValue: String(tier.rate),
      inputAttributes: { step: '0.05', min: '0', max: '30' },
      showCancelButton: true,
      confirmButtonText: 'Save',
      inputValidator: (value) => {
        const n = Number(value);
        if (!value || isNaN(n) || n <= 0 || n > 30) return 'Enter a rate between 0 and 30%';
        return null;
      }
    });
    if (result.isConfirmed && result.value) {
      tier.rate = Math.round(Number(result.value) * 100) / 100;
      this.toastService.success('Rate updated');
    }
  }

  async editLoanRate(pkg: LoanPackage): Promise<void> {
    const result = await Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      title: `Edit ${pkg.name} rate`,
      input: 'number',
      inputLabel: 'Annual rate (%)',
      inputValue: String(pkg.rate),
      inputAttributes: { step: '0.05', min: '0', max: '40' },
      showCancelButton: true,
      confirmButtonText: 'Save',
      inputValidator: (value) => {
        const n = Number(value);
        if (!value || isNaN(n) || n <= 0 || n > 40) return 'Enter a rate between 0 and 40%';
        return null;
      }
    });
    if (result.isConfirmed && result.value) {
      pkg.rate = Math.round(Number(result.value) * 100) / 100;
      this.toastService.success('Rate updated');
    }
  }

  togglePackage(pkg: LoanPackage): void {
    pkg.active = !pkg.active;
    this.toastService.success(pkg.active ? 'Package enabled' : 'Package disabled');
  }
}
