/**
 * Shared mutable demo state.
 *
 * The fixtures in demo-banking-fixtures.ts are immutable seed data. This store
 * holds the *live* demo collections so records created during a session
 * (register customer, manual loan, add employee, loan approval) actually appear
 * in the relevant dashboard tables instead of being discarded after a toast.
 *
 * State is seeded from the fixtures, persisted to localStorage for the session,
 * and reset on each demo login so every walkthrough starts clean.
 */
import {
  DEMO_CUSTOMERS, DEMO_LOAN_APPLICATIONS, DEMO_BENEFICIARIES, DEMO_STANDING_ORDERS, DEMO_CARDS,
  DEMO_ANNOUNCEMENTS, DEMO_FD_TIERS, DEMO_LOAN_PACKAGES, DEMO_SERVICE_REQUESTS, DEMO_CHEQUES,
  DEMO_AUDIT_ENTRIES,
} from './demo-banking-fixtures';

const STORAGE_KEY = 'bank-demo-store';
const BASE_EMPLOYEE_COUNT = 24;

interface DemoStoreState {
  customers: any[];
  loanApplications: any[];
  employees: any[];
  beneficiaries: any[];
  standingOrders: any[];
  cards: any[];
  announcements: any[];
  fdTiers: any[];
  loanPackages: any[];
  serviceRequests: any[];
  cheques: any[];
  audit: any[];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function seed(): DemoStoreState {
  return {
    customers: clone(DEMO_CUSTOMERS),
    loanApplications: clone(DEMO_LOAN_APPLICATIONS),
    employees: [],
    beneficiaries: clone(DEMO_BENEFICIARIES),
    standingOrders: clone(DEMO_STANDING_ORDERS),
    cards: clone(DEMO_CARDS),
    announcements: clone(DEMO_ANNOUNCEMENTS),
    fdTiers: clone(DEMO_FD_TIERS),
    loanPackages: clone(DEMO_LOAN_PACKAGES),
    serviceRequests: clone(DEMO_SERVICE_REQUESTS),
    cheques: clone(DEMO_CHEQUES),
    audit: clone(DEMO_AUDIT_ENTRIES),
  };
}

/**
 * Append an entry to the live audit stream. Every consequential write in this
 * store funnels through here so the manager audit log (and, downstream, the
 * activity feed) fills in as the demo is driven. Callers persist afterwards;
 * the public recordAudit() below persists on their behalf.
 */
function appendAudit(entry: { actor?: string; category: string; action: string; detail: string; outcome: string }): void {
  load().audit.unshift({
    id: 'AUD-' + Math.floor(9100 + Math.random() * 8899),
    timestamp: new Date().toISOString(),
    actor: entry.actor ?? 'MAN-502 · Branch Manager',
    category: entry.category,
    action: entry.action,
    detail: entry.detail,
    outcome: entry.outcome,
  });
}

let state: DemoStoreState | null = null;

function hasStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function load(): DemoStoreState {
  if (state) return state;
  if (hasStorage()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // Merge over a fresh seed so collections added since this blob was
        // written (a new demo release) are backfilled instead of arriving as
        // undefined; the persisted values still win for keys they contain.
        state = { ...seed(), ...(JSON.parse(raw) as Partial<DemoStoreState>) } as DemoStoreState;
        return state;
      }
    } catch {
      /* fall through to seed */
    }
  }
  state = seed();
  return state;
}

function persist(): void {
  if (hasStorage() && state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota / availability errors in demo */
    }
  }
}

export const demoStore = {
  // ----- Customers (employee customer directory) -----
  getCustomers(): any[] {
    return load().customers;
  },
  addCustomer(customer: any): void {
    load().customers.unshift(customer);
    appendAudit({
      actor: 'EMP · Registration desk',
      category: 'Account',
      action: 'Customer registered',
      detail: `${customer.user_id ?? customer.username ?? 'New customer'} · ${customer.fullname ?? ''}`.trim(),
      outcome: 'Created',
    });
    persist();
  },

  // ----- Loan applications (manager pending approvals) -----
  getLoanApplications(): any[] {
    return load().loanApplications;
  },
  addLoanApplication(loan: any): void {
    load().loanApplications.unshift(loan);
    persist();
  },
  removeLoanApplication(loanId: string | number): void {
    const s = load();
    s.loanApplications = s.loanApplications.filter(
      (l) => String(l.loan_basic_detail_id) !== String(loanId)
    );
    persist();
  },

  // ----- Employees (added by manager) -----
  getEmployees(): any[] {
    return load().employees;
  },
  addEmployee(employee: any): void {
    load().employees.unshift(employee);
    appendAudit({
      category: 'Employee',
      action: 'Employee onboarded',
      detail: `${employee.employee_id ?? ''} · ${employee.fullname ?? employee.username ?? 'New employee'} as ${employee.role ?? 'staff'}`.trim(),
      outcome: 'Created',
    });
    persist();
  },
  get employeeCount(): number {
    return BASE_EMPLOYEE_COUNT + load().employees.length;
  },

  // ----- Beneficiaries (customer saved payees) -----
  getBeneficiaries(): any[] {
    return load().beneficiaries;
  },
  addBeneficiary(beneficiary: any): void {
    load().beneficiaries.unshift(beneficiary);
    persist();
  },
  removeBeneficiary(id: string | number): void {
    const s = load();
    s.beneficiaries = s.beneficiaries.filter((b) => String(b.id) !== String(id));
    persist();
  },
  hasBeneficiary(accountId: string): boolean {
    return load().beneficiaries.some(
      (b) => String(b.account_id).toUpperCase() === String(accountId).toUpperCase()
    );
  },

  // ----- Standing orders / bill payments -----
  getStandingOrders(): any[] {
    return load().standingOrders;
  },
  addStandingOrder(order: any): void {
    load().standingOrders.unshift(order);
    persist();
  },
  removeStandingOrder(id: string | number): void {
    const s = load();
    s.standingOrders = s.standingOrders.filter((o) => String(o.id) !== String(id));
    persist();
  },
  toggleStandingOrder(id: string | number): void {
    const order = load().standingOrders.find((o) => String(o.id) === String(id));
    if (order) {
      order.status = order.status === 'Active' ? 'Paused' : 'Active';
      persist();
    }
  },

  // ----- Cards (customer card management) -----
  getCards(): any[] {
    return load().cards;
  },
  toggleCardFreeze(id: string | number): void {
    const card = load().cards.find((c) => String(c.id) === String(id));
    if (card) {
      card.status = card.status === 'Active' ? 'Frozen' : 'Active';
      persist();
    }
  },

  // ----- Announcements (manager staff board) -----
  getAnnouncements(): any[] {
    return load().announcements;
  },
  addAnnouncement(announcement: any): void {
    load().announcements.unshift(announcement);
    persist();
  },
  removeAnnouncement(id: string | number): void {
    const s = load();
    s.announcements = s.announcements.filter((a) => String(a.id) !== String(id));
    persist();
  },
  toggleAnnouncementPin(id: string | number): void {
    const a = load().announcements.find((x) => String(x.id) === String(id));
    if (a) {
      a.pinned = !a.pinned;
      persist();
    }
  },

  // ----- Product configuration (FD tiers + loan packages) -----
  getFdTiers(): any[] {
    return load().fdTiers;
  },
  setFdRate(term: string, rate: number): void {
    const tier = load().fdTiers.find((t) => t.term === term);
    if (tier) {
      tier.rate = rate;
      appendAudit({ category: 'Loan', action: 'FD rate updated', detail: `${term} fixed deposit → ${rate}% p.a.`, outcome: 'Updated' });
      persist();
    }
  },
  getLoanPackages(): any[] {
    return load().loanPackages;
  },
  setLoanRate(name: string, rate: number): void {
    const pkg = load().loanPackages.find((p) => p.name === name);
    if (pkg) {
      pkg.rate = rate;
      appendAudit({ category: 'Loan', action: 'Loan rate updated', detail: `${name} → ${rate}% p.a.`, outcome: 'Updated' });
      persist();
    }
  },
  toggleLoanPackage(name: string): void {
    const pkg = load().loanPackages.find((p) => p.name === name);
    if (pkg) {
      pkg.active = !pkg.active;
      appendAudit({ category: 'Loan', action: `Loan package ${pkg.active ? 'enabled' : 'disabled'}`, detail: `${name} (${pkg.type})`, outcome: 'Updated' });
      persist();
    }
  },

  // ----- Service requests (employee ticket queue) -----
  getServiceRequests(): any[] {
    return load().serviceRequests;
  },
  addServiceRequest(request: any): void {
    load().serviceRequests.unshift(request);
    appendAudit({
      actor: 'EMP · Customer service',
      category: 'Account',
      action: 'Service request opened',
      detail: `${request.ticket_id} · ${request.category}`,
      outcome: 'Created',
    });
    persist();
  },
  advanceServiceRequest(ticketId: string | number): void {
    const r = load().serviceRequests.find((x) => String(x.ticket_id) === String(ticketId));
    if (!r) return;
    if (r.status === 'Open') r.status = 'In progress';
    else if (r.status === 'In progress') r.status = 'Resolved';
    else return;
    appendAudit({
      actor: 'EMP · Customer service',
      category: 'Account',
      action: r.status === 'Resolved' ? 'Service request resolved' : 'Service request updated',
      detail: `${r.ticket_id} · ${r.category} → ${r.status}`,
      outcome: 'Updated',
    });
    persist();
  },

  // ----- Cheque clearing (employee clearing queue) -----
  getCheques(): any[] {
    return load().cheques;
  },
  advanceCheque(chequeId: string | number): void {
    const c = load().cheques.find((x) => String(x.cheque_id) === String(chequeId));
    if (!c) return;
    if (c.status === 'Received') c.status = 'In clearing';
    else if (c.status === 'In clearing') c.status = 'Cleared';
    else return;
    appendAudit({
      actor: 'EMP · Clearing desk',
      category: 'Transaction',
      action: c.status === 'Cleared' ? 'Cheque cleared' : 'Cheque sent to clearing',
      detail: `${c.cheque_id} · Rs. ${Number(c.amount).toLocaleString()} · ${c.drawer_bank}`,
      outcome: 'Updated',
    });
    persist();
  },
  returnCheque(chequeId: string | number): void {
    const c = load().cheques.find((x) => String(x.cheque_id) === String(chequeId));
    if (c) {
      c.status = 'Returned';
      appendAudit({
        actor: 'EMP · Clearing desk',
        category: 'Transaction',
        action: 'Cheque returned',
        detail: `${c.cheque_id} · Rs. ${Number(c.amount).toLocaleString()} marked unpaid`,
        outcome: 'Flagged',
      });
      persist();
    }
  },

  // ----- Audit stream (manager audit log) -----
  getAuditLog(): any[] {
    return load().audit;
  },
  /**
   * Record an audit entry from a call site that owns semantic context the store
   * cannot infer — e.g. a loan decision, where approve and reject both remove
   * the application but mean very different things.
   */
  recordAudit(entry: { actor?: string; category: string; action: string; detail: string; outcome: string }): void {
    appendAudit(entry);
    persist();
  },

  /** Reset to fresh seed data — call on each demo login. */
  reset(): void {
    state = seed();
    persist();
  },
};
