import { Component } from '@angular/core';

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

  entries: AuditEntry[] = [
    { id: 'AUD-9041', timestamp: '2026-05-24T09:42:00', actor: 'MAN-502 · Branch Manager', category: 'Loan',        action: 'Loan approved',        detail: 'LN-50208 · Rs. 1,850,000 business loan for CUS-1003', outcome: 'Approved' },
    { id: 'AUD-9038', timestamp: '2026-05-24T09:15:00', actor: 'MAN-502 · Branch Manager', category: 'Loan',        action: 'Loan rejected',        detail: 'LN-50210 · insufficient income documentation',         outcome: 'Rejected' },
    { id: 'AUD-9034', timestamp: '2026-05-23T16:30:00', actor: 'EMP-2002 · N. Silva',      category: 'Account',     action: 'Account opened',       detail: 'ACC-493152 current account for CUS-1012',              outcome: 'Created' },
    { id: 'AUD-9030', timestamp: '2026-05-23T14:05:00', actor: 'MAN-502 · Branch Manager', category: 'Employee',    action: 'Employee deactivated', detail: 'EMP-2007 · S. Weerasinghe access suspended',           outcome: 'Updated' },
    { id: 'AUD-9027', timestamp: '2026-05-23T11:20:00', actor: 'SYSTEM · Fraud engine',    category: 'Security',    action: 'Suspicious login flagged', detail: 'Multiple failed attempts on CUS-1008 from new device', outcome: 'Flagged' },
    { id: 'AUD-9021', timestamp: '2026-05-22T15:48:00', actor: 'EMP-2005 · D. Perera',     category: 'Transaction', action: 'Large withdrawal reviewed', detail: 'WDR-32960 · Rs. 150,000 dual-authorised',          outcome: 'Approved' },
    { id: 'AUD-9018', timestamp: '2026-05-22T10:10:00', actor: 'MAN-502 · Branch Manager', category: 'Employee',    action: 'Employee added',       detail: 'EMP-2008 · P. Dissanayake onboarded as Teller',        outcome: 'Created' },
    { id: 'AUD-9012', timestamp: '2026-05-21T13:35:00', actor: 'MAN-502 · Branch Manager', category: 'Loan',        action: 'Loan approved',        detail: 'LN-50201 · Rs. 420,000 personal loan for CUS-1004',    outcome: 'Approved' },
    { id: 'AUD-9007', timestamp: '2026-05-21T09:00:00', actor: 'SYSTEM · Compliance',      category: 'Security',    action: 'KYC re-verification', detail: 'CUS-1002 documents re-validated',                       outcome: 'Updated' },
    { id: 'AUD-9001', timestamp: '2026-05-20T16:55:00', actor: 'EMP-2003 · T. Fernando',   category: 'Transaction', action: 'Cheque cleared',       detail: 'DEP-55014 · Rs. 128,000 cheque marked cleared',        outcome: 'Updated' }
  ];

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
