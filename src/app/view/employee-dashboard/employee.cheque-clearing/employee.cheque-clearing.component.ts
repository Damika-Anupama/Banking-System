import { Component } from '@angular/core';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';
import { TableSort } from 'src/app/shared/table-sort';

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
export class EmployeeChequeClearingComponent {
  constructor(private toastService: ToastService) {}

  searchTerm = '';
  statusFilter = 'all';

  cheques: Cheque[] = [
    { cheque_id: 'CHQ-8801', cheque_no: '884201', account_id: 'ACC-492810', drawer_bank: 'Commercial Bank',   amount: 128000, deposited: '2026-05-23T14:20:00', expected_clear: '2026-05-26', status: 'In clearing' },
    { cheque_id: 'CHQ-8799', cheque_no: '551093', account_id: 'ACC-492812', drawer_bank: 'Sampath Bank',      amount: 240000, deposited: '2026-05-23T10:05:00', expected_clear: '2026-05-26', status: 'In clearing' },
    { cheque_id: 'CHQ-8795', cheque_no: '770418', account_id: 'ACC-118209', drawer_bank: 'HNB',               amount: 64000,  deposited: '2026-05-24T09:35:00', expected_clear: '2026-05-27', status: 'Received' },
    { cheque_id: 'CHQ-8790', cheque_no: '330275', account_id: 'ACC-492811', drawer_bank: 'Bank of Ceylon',    amount: 18500,  deposited: '2026-05-22T16:40:00', expected_clear: '2026-05-25', status: 'Cleared' },
    { cheque_id: 'CHQ-8786', cheque_no: '992140', account_id: 'ACC-772901', drawer_bank: "People's Bank",     amount: 95000,  deposited: '2026-05-22T11:15:00', expected_clear: '2026-05-25', status: 'Cleared' },
    { cheque_id: 'CHQ-8781', cheque_no: '447821', account_id: 'ACC-660412', drawer_bank: 'Seylan Bank',       amount: 52000,  deposited: '2026-05-21T13:50:00', expected_clear: '2026-05-24', status: 'Returned' }
  ];

  readonly sort = new TableSort<Cheque>({
    amount: (c) => Number(c.amount || 0),
    status: (c) => String(c.status || '').toLowerCase(),
    bank: (c) => String(c.drawer_bank || '').toLowerCase(),
  });

  toggleSort(column: string): void {
    this.sort.toggle(column);
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
    if (cheque.status === 'Received') {
      cheque.status = 'In clearing';
      this.toastService.success('Sent to clearing');
    } else if (cheque.status === 'In clearing') {
      cheque.status = 'Cleared';
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
      cheque.status = 'Returned';
      this.toastService.success('Marked returned', `Reason: ${result.value}`);
    });
  }
}
