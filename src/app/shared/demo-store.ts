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
import { DEMO_CUSTOMERS, DEMO_LOAN_APPLICATIONS } from './demo-banking-fixtures';

const STORAGE_KEY = 'bank-demo-store';
const BASE_EMPLOYEE_COUNT = 24;

interface DemoStoreState {
  customers: any[];
  loanApplications: any[];
  employees: any[];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function seed(): DemoStoreState {
  return {
    customers: clone(DEMO_CUSTOMERS),
    loanApplications: clone(DEMO_LOAN_APPLICATIONS),
    employees: [],
  };
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
        state = JSON.parse(raw) as DemoStoreState;
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
    persist();
  },
  get employeeCount(): number {
    return BASE_EMPLOYEE_COUNT + load().employees.length;
  },

  /** Reset to fresh seed data — call on each demo login. */
  reset(): void {
    state = seed();
    persist();
  },
};
