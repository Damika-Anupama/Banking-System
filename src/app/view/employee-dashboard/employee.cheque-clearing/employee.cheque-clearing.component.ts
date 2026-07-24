import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';
import { TableSort } from 'src/app/shared/table-sort';
import { demoStore } from 'src/app/shared/demo-store';

type ChequeStatus = 'Received' | 'In clearing' | 'Cleared' | 'Returned';

interface Cheque {
  cheque_id: string;
  cheque_no: string;
  account_id: string;
  drawer_bank: string;
  amount: number;
  deposited: string;
  expected_clear: string;
  status: ChequeStatus;
}

@Component({
  selector: 'app-employee.cheque-clearing',
  standalone: false,
  templateUrl: './employee.cheque-clearing.component.html',
  styleUrls: ['./employee.cheque-clearing.component.scss']
})
export class EmployeeChequeClearingComponent implements OnInit {
  constructor(private toastService: ToastService) {}

  searchTerm = '';
  statusFilter = 'all';

  /** True while the pipeline rows are being read into the view. */
  isLoading = true;

  /** Rough shape of the cheque table so the loading skeleton holds the layout. */
  readonly chequeSkeletonColumns = ['Cheque', 'Drawer bank', 'To account', 'Amount', 'Expected', 'Status', 'Actions'];

  cheques: Cheque[] = demoStore.getCheques();

  ngOnInit(): void {
    // The demo store resolves synchronously, but the flag keeps the page on
    // the same skeleton-while-loading pattern as the customer pages.
    this.isLoading = false;
  }

  readonly sort = new TableSort<Cheque>({
    amount: (c) => Number(c.amount || 0),
    status: (c) => String(c.status || '').toLowerCase(),
    bank: (c) => String(c.drawer_bank || '').toLowerCase(),
  });

  toggleSort(column: string): void {
    this.sort.toggle(column);
    this.chequePage = 1;
  }

  /** Filters narrow the list, so pagination restarts from the first page. */
  onFilterChange(): void {
    this.chequePage = 1;
  }

  get filteredCheques(): Cheque[] {
    const q = this.searchTerm.trim().toLowerCase();
    const matched = this.cheques.filter(c => {
      const matchesStatus = this.statusFilter === 'all' || c.status === this.statusFilter;
      const matchesSearch = !q || [c.cheque_id, c.cheque_no, c.account_id, c.drawer_bank].join(' ').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });

    return this.sort.apply(matched);
  }

  chequePage = 1;
  readonly chequePageSize = 5;

  get totalChequePages(): number {
    return Math.max(1, Math.ceil(this.filteredCheques.length / this.chequePageSize));
  }

  get pagedCheques(): Cheque[] {
    const page = Math.min(this.chequePage, this.totalChequePages);
    const start = (page - 1) * this.chequePageSize;
    return this.filteredCheques.slice(start, start + this.chequePageSize);
  }

  get chequeRangeStart(): number {
    return this.filteredCheques.length === 0 ? 0 : (Math.min(this.chequePage, this.totalChequePages) - 1) * this.chequePageSize + 1;
  }

  get chequeRangeEnd(): number {
    return Math.min(this.chequeRangeStart + this.chequePageSize - 1, this.filteredCheques.length);
  }

  setChequePage(page: number): void {
    this.chequePage = Math.max(1, Math.min(page, this.totalChequePages));
  }

  get receivedCount(): number { return this.cheques.filter(c => c.status === 'Received').length; }
  get inClearingCount(): number { return this.cheques.filter(c => c.status === 'In clearing').length; }
  get clearedCount(): number { return this.cheques.filter(c => c.status === 'Cleared').length; }
  get pendingValue(): number {
    return this.cheques.filter(c => c.status === 'Received' || c.status === 'In clearing').reduce((s, c) => s + c.amount, 0);
  }

  statusTone(status: ChequeStatus): string {
    if (status === 'Cleared') return 'demo-status-success';
    if (status === 'Returned') return 'demo-status-danger';
    if (status === 'In clearing') return 'demo-status-info';
    return 'demo-status-warning';
  }

  canAdvance(c: Cheque): boolean {
    return c.status === 'Received' || c.status === 'In clearing';
  }

  advance(cheque: Cheque): void {
    const previous = cheque.status;
    if (previous !== 'Received' && previous !== 'In clearing') return;
    demoStore.advanceCheque(cheque.cheque_id);
    this.cheques = [...demoStore.getCheques()];
    if (previous === 'Received') {
      this.toastService.success('Sent to clearing');
    } else {
      this.toastService.success(
        'Cheque cleared',
        `Rs. ${cheque.amount.toLocaleString()} credited to ${cheque.account_id}.`
      );
    }
  }

  markReturned(cheque: Cheque): void {
    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      icon: 'warning',
      title: 'Mark cheque returned?',
      html: `Cheque <strong>${cheque.cheque_no}</strong> (Rs. ${cheque.amount.toLocaleString()}) will be marked unpaid.`,
      input: 'select',
      inputOptions: { 'Insufficient funds': 'Insufficient funds', 'Signature mismatch': 'Signature mismatch', 'Stale dated': 'Stale dated', 'Other': 'Other' },
      inputPlaceholder: 'Reason',
      showCancelButton: true,
      confirmButtonText: 'Mark returned',
      inputValidator: (v) => (!v ? 'Select a reason' : null)
    }).then(result => {
      if (!result.isConfirmed) return;
      demoStore.returnCheque(cheque.cheque_id);
      this.cheques = [...demoStore.getCheques()];
      this.toastService.success('Marked returned', `Reason: ${result.value}`);
    });
  }
}
