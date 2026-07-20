import { Component } from '@angular/core';
import { demoStore } from 'src/app/shared/demo-store';

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

  readonly categories = ['Loan', 'Employee', 'Account', 'Security', 'Transaction'];

  entries: AuditEntry[] = demoStore.getAuditLog();

  get filteredEntries(): AuditEntry[] {
    const q = this.searchTerm.trim().toLowerCase();
    return this.entries.filter(e => {
      const matchesCategory = this.categoryFilter === 'all' || e.category === this.categoryFilter;
      const matchesSearch = !q || [e.id, e.actor, e.action, e.detail, e.category, e.outcome].join(' ').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
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
