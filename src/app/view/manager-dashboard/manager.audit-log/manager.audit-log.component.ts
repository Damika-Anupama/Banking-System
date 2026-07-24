import { Component } from '@angular/core';
import { demoStore } from 'src/app/shared/demo-store';
import { TableSort } from 'src/app/shared/table-sort';

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  category: 'Loan' | 'Employee' | 'Account' | 'Security' | 'Transaction';
  action: string;
  detail: string;
  outcome: 'Approved' | 'Rejected' | 'Created' | 'Updated' | 'Flagged';
}

@Component({
  selector: 'app-manager.audit-log',
  standalone: false,
  templateUrl: './manager.audit-log.component.html',
  styleUrls: ['./manager.audit-log.component.scss']
})
export class ManagerAuditLogComponent {
  searchTerm = '';
  categoryFilter = 'all';

  /**
   * The log resolves from the local demo store, so this only holds the
   * skeleton for a beat — but it keeps the loading behaviour identical to
   * the pages that really do fetch, instead of flash-swapping layouts.
   */
  isLoading = true;

  /** Mirrors the trail's headers so the loading skeleton holds the layout. */
  readonly auditSkeletonColumns = ['Time', 'Actor', 'Category', 'Action', 'Outcome'];

  readonly categories = ['Loan', 'Employee', 'Account', 'Security', 'Transaction'];

  entries: AuditEntry[] = demoStore.getAuditLog();

  constructor() {
    setTimeout(() => (this.isLoading = false), 250);
  }

  /** Column sorting for the trail, same cycle as the customer tables. */
  readonly sort = new TableSort<AuditEntry>({
    time: (e) => new Date(e.timestamp || 0).getTime(),
  });

  toggleSort(column: string): void {
    this.sort.toggle(column);
    // Reordering restarts pagination so the new first rows are visible.
    this.auditPage = 1;
  }

  get filteredEntries(): AuditEntry[] {
    const q = this.searchTerm.trim().toLowerCase();
    const matched = this.entries.filter(e => {
      const matchesCategory = this.categoryFilter === 'all' || e.category === this.categoryFilter;
      const matchesSearch = !q || [e.id, e.actor, e.action, e.detail, e.category, e.outcome].join(' ').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });

    return this.sort.apply(matched);
  }

  // ----- Pagination (clamped getters, same shape as the customer loan table) -----
  auditPage = 1;
  readonly auditPageSize = 8;

  get auditCount(): number {
    return this.filteredEntries.length;
  }

  get totalAuditPages(): number {
    return Math.max(1, Math.ceil(this.auditCount / this.auditPageSize));
  }

  get pagedEntries(): AuditEntry[] {
    const page = Math.min(this.auditPage, this.totalAuditPages);
    const start = (page - 1) * this.auditPageSize;
    return this.filteredEntries.slice(start, start + this.auditPageSize);
  }

  get auditRangeStart(): number {
    return this.auditCount === 0
      ? 0
      : (Math.min(this.auditPage, this.totalAuditPages) - 1) * this.auditPageSize + 1;
  }

  get auditRangeEnd(): number {
    return Math.min(this.auditRangeStart + this.auditPageSize - 1, this.auditCount);
  }

  setAuditPage(page: number): void {
    this.auditPage = Math.max(1, Math.min(page, this.totalAuditPages));
  }

  /** New search or category filter starts back at page 1 so matches are never hidden off-page. */
  onFilterChange(): void {
    this.auditPage = 1;
  }

  get approvalCount(): number { return this.entries.filter(e => e.outcome === 'Approved').length; }
  get rejectionCount(): number { return this.entries.filter(e => e.outcome === 'Rejected').length; }
  get securityCount(): number { return this.entries.filter(e => e.category === 'Security').length; }

  categoryTone(category: string): string {
    switch (category) {
      case 'Loan': return 'bg-gradient-to-r from-amber-400/80 to-orange-500/80';
      case 'Employee': return 'bg-gradient-to-r from-glass-purple/80 to-glass-pink/80';
      case 'Account': return 'bg-gradient-to-r from-glass-emerald/80 to-glass-cyan/80';
      case 'Security': return 'bg-gradient-to-r from-glass-pink/80 to-glass-orange/80';
      default: return 'bg-gradient-to-r from-glass-cyan/80 to-glass-blue/80';
    }
  }

  outcomeTone(outcome: string): string {
    if (outcome === 'Approved' || outcome === 'Created') return 'demo-status-success';
    if (outcome === 'Rejected' || outcome === 'Flagged') return 'demo-status-danger';
    return 'demo-status-info';
  }
}
