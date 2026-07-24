import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from '../../../service/theme.service';
import { trapTabKey } from '../../focus-trap';
import { readStorage, removeStorage } from 'src/app/shared/safe-storage';

type PaletteAction = 'toggle-theme' | 'sign-out';

interface PaletteItem {
  label: string;
  description: string;
  icon: string;
  roles: string[];
  /** Section header this item appears under when browsing (empty query). */
  group: string;
  route?: string;
  action?: PaletteAction;
}

/** A run of label text that either did or did not match the query. */
export interface PaletteSegment {
  text: string;
  matched: boolean;
}

/** A single selectable row: the item, its flat keyboard index, and label highlight. */
export interface PaletteRow {
  item: PaletteItem;
  index: number;
  segments: PaletteSegment[];
}

/** A visual group. `header` is null when a query is active (flat ranked list). */
export interface PaletteGroup {
  header: string | null;
  rows: PaletteRow[];
}

interface FuzzyResult {
  score: number;
  positions: number[];
}

/**
 * Lightweight in-order fuzzy match (no deps). Returns null when not every query
 * character is found in sequence. Scoring favours, in order of strength:
 * exact prefix > word-boundary starts > contiguous runs > scattered subsequence,
 * with a small penalty for gaps and for matches that start late in the text.
 */
export function fuzzyMatch(query: string, text: string): FuzzyResult | null {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (!q) return { score: 0, positions: [] };

  const positions: number[] = [];
  let qi = 0;
  let score = 0;
  let prevMatch = -2;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] !== q[qi]) continue;
    positions.push(ti);
    const prevChar = ti > 0 ? t[ti - 1] : '';
    const atWordStart = ti === 0 || /[^a-z0-9]/.test(prevChar);
    if (atWordStart) score += 8;
    if (ti === prevMatch + 1) score += 6;          // contiguous
    else if (prevMatch >= 0) score -= Math.min(ti - prevMatch - 1, 4); // gap
    score += 1;                                     // base per char
    prevMatch = ti;
    qi++;
  }

  if (qi < q.length) return null;                   // ran out before matching all
  if (t.startsWith(q)) score += 20;                 // exact prefix wins
  else if (positions[0] === 0) score += 6;          // starts at char 0
  score -= positions[0] * 0.2;                       // earlier is better
  return { score, positions };
}

/** Split label text into matched / unmatched runs for template highlighting. */
export function buildLabelSegments(text: string, positions: number[]): PaletteSegment[] {
  if (!positions.length) return [{ text, matched: false }];
  const matchedSet = new Set(positions);
  const segments: PaletteSegment[] = [];
  let current = '';
  let currentMatched = matchedSet.has(0);
  for (let i = 0; i < text.length; i++) {
    const isMatched = matchedSet.has(i);
    if (isMatched === currentMatched) {
      current += text[i];
    } else {
      segments.push({ text: current, matched: currentMatched });
      current = text[i];
      currentMatched = isMatched;
    }
  }
  if (current) segments.push({ text: current, matched: currentMatched });
  return segments;
}

const EMPTY_CAP = 12;
const QUERY_CAP = 12;
const LABEL_WEIGHT = 100; // any label match outranks any description-only match

const ALL_ITEMS: PaletteItem[] = [
  // General (public)
  { label: 'Welcome', description: 'Landing page', icon: 'fa-home', route: '/welcome', roles: ['*'], group: 'General' },
  { label: 'Sign in', description: 'Online banking login', icon: 'fa-right-to-bracket', route: '/sign-in', roles: ['*'], group: 'General' },
  { label: 'Create account', description: 'New customer registration', icon: 'fa-user-plus', route: '/sign-up', roles: ['*'], group: 'General' },
  // Customer
  { label: 'Dashboard overview', description: 'Account balances & activity', icon: 'fa-gauge', route: '/dashboard/home', roles: ['CUSTOMER', 'DEMO'], group: 'Customer' },
  { label: 'Transfer money', description: 'Send funds & payment history', icon: 'fa-paper-plane', route: '/dashboard/transaction', roles: ['CUSTOMER', 'DEMO'], group: 'Customer' },
  { label: 'Standing orders', description: 'Bill payments & recurring transfers', icon: 'fa-repeat', route: '/dashboard/payments', roles: ['CUSTOMER', 'DEMO'], group: 'Customer' },
  { label: 'Fixed deposits', description: 'Invest & track deposits', icon: 'fa-vault', route: '/dashboard/fixed-deposit', roles: ['CUSTOMER', 'DEMO'], group: 'Customer' },
  { label: 'Loans', description: 'FD-backed loans & installments', icon: 'fa-hand-holding-dollar', route: '/dashboard/loan', roles: ['CUSTOMER', 'DEMO'], group: 'Customer' },
  { label: 'My cards', description: 'Debit & credit card management', icon: 'fa-credit-card', route: '/dashboard/cards', roles: ['CUSTOMER', 'DEMO'], group: 'Customer' },
  { label: 'Customer settings', description: 'Profile & security settings', icon: 'fa-cog', route: '/dashboard/settings', roles: ['CUSTOMER', 'DEMO'], group: 'Customer' },
  // Employee
  { label: 'Employee home', description: 'Branch queue & customer service', icon: 'fa-gauge-high', route: '/employee-dashboard/employee-home', roles: ['EMPLOYEE', 'DEMO'], group: 'Employee' },
  { label: 'Register customer', description: 'New customer onboarding', icon: 'fa-user-plus', route: '/employee-dashboard/employee-register-customer', roles: ['EMPLOYEE', 'DEMO'], group: 'Employee' },
  { label: 'Cash deposit', description: 'Process customer deposits', icon: 'fa-money-bill-trend-up', route: '/employee-dashboard/employee-deposit', roles: ['EMPLOYEE', 'DEMO'], group: 'Employee' },
  { label: 'Withdrawal', description: 'Process cash withdrawal requests', icon: 'fa-money-bill-wave', route: '/employee-dashboard/employee-withdraw', roles: ['EMPLOYEE', 'DEMO'], group: 'Employee' },
  { label: 'Create loan', description: 'Manual loan application entry', icon: 'fa-file-signature', route: '/employee-dashboard/employee-create-loan', roles: ['EMPLOYEE', 'DEMO'], group: 'Employee' },
  { label: 'Customer 360', description: 'Full customer relationship view', icon: 'fa-user-tag', route: '/employee-dashboard/employee-customer360', roles: ['EMPLOYEE', 'DEMO'], group: 'Employee' },
  { label: 'Cheque clearing', description: 'Process and clear cheques', icon: 'fa-file-invoice-dollar', route: '/employee-dashboard/employee-cheque-clearing', roles: ['EMPLOYEE', 'DEMO'], group: 'Employee' },
  { label: 'Service requests', description: 'Customer support tickets', icon: 'fa-headset', route: '/employee-dashboard/employee-service-requests', roles: ['EMPLOYEE', 'DEMO'], group: 'Employee' },
  { label: 'My performance', description: 'Daily targets & activity metrics', icon: 'fa-chart-bar', route: '/employee-dashboard/employee-performance', roles: ['EMPLOYEE', 'DEMO'], group: 'Employee' },
  // Manager
  { label: 'Manager home', description: 'Branch performance command center', icon: 'fa-chart-line', route: '/manager-dashboard/manager-home', roles: ['MANAGER', 'DEMO'], group: 'Manager' },
  { label: 'Loan approvals', description: 'Review pending loan applications', icon: 'fa-stamp', route: '/manager-dashboard/manager-loan-approval', roles: ['MANAGER', 'DEMO'], group: 'Manager' },
  { label: 'Employee management', description: 'Branch staff directory', icon: 'fa-users', route: '/manager-dashboard/manager-employees', roles: ['MANAGER', 'DEMO'], group: 'Manager' },
  { label: 'Branch reports', description: 'Analytics, cash flow & portfolio', icon: 'fa-chart-pie', route: '/manager-dashboard/manager-reports', roles: ['MANAGER', 'DEMO'], group: 'Manager' },
  { label: 'Announcements', description: 'Post and pin team notices', icon: 'fa-bullhorn', route: '/manager-dashboard/manager-announcements', roles: ['MANAGER', 'DEMO'], group: 'Manager' },
  { label: 'Product configuration', description: 'Manage banking products & rates', icon: 'fa-layer-group', route: '/manager-dashboard/manager-products', roles: ['MANAGER', 'DEMO'], group: 'Manager' },
  { label: 'Audit log', description: 'Activity trail & compliance view', icon: 'fa-shield-halved', route: '/manager-dashboard/manager-audit-log', roles: ['MANAGER', 'DEMO'], group: 'Manager' },
  // Quick actions (run instantly instead of navigating)
  { label: 'Toggle theme', description: 'Switch between light and dark mode', icon: 'fa-circle-half-stroke', action: 'toggle-theme', roles: ['*'], group: 'Quick actions' },
  { label: 'Sign out', description: 'End this session and return to sign in', icon: 'fa-right-from-bracket', action: 'sign-out', roles: ['CUSTOMER', 'EMPLOYEE', 'MANAGER', 'DEMO'], group: 'Quick actions' },
];

@Component({
  selector: 'app-command-palette',
  standalone: false,
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.scss']
})
export class CommandPaletteComponent {
  isOpen = false;
  query = '';
  selectedIndex = 0;

  constructor(private router: Router, private themeService: ThemeService) {}

  private get userRole(): string {
    const type = readStorage('userType');
    const demo = readStorage('demoMode');
    if (type) return type;
    if (demo) return 'DEMO';
    return '*';
  }

  private roleFilteredItems(role: string): PaletteItem[] {
    return ALL_ITEMS.filter(item =>
      item.roles.includes(role) || item.roles.includes('*') ||
      (role === 'DEMO' && item.roles.some(r => r !== '*'))
    );
  }

  // --- Computed view (memoised on role + query so change detection stays cheap) ---
  private cacheKey = ' ';
  private cachedGroups: PaletteGroup[] = [];
  private cachedItems: PaletteItem[] = [];

  private rebuild(): void {
    const role = this.userRole;
    const rawQuery = this.query.trim();
    const q = rawQuery.toLowerCase();
    const key = role + '::' + q;
    if (key === this.cacheKey) return;
    this.cacheKey = key;

    const roleItems = this.roleFilteredItems(role);
    const flat: PaletteRow[] = [];
    let groups: PaletteGroup[] = [];

    if (!q) {
      // Browsing: grouped by section, headers shown.
      const byGroup = new Map<string, PaletteRow[]>();
      for (const item of roleItems.slice(0, EMPTY_CAP)) {
        const row: PaletteRow = {
          item,
          index: flat.length,
          segments: [{ text: item.label, matched: false }],
        };
        flat.push(row);
        if (!byGroup.has(item.group)) byGroup.set(item.group, []);
        byGroup.get(item.group)!.push(row);
      }
      groups = Array.from(byGroup, ([header, rows]) => ({ header, rows }));
    } else {
      // Searching: single flat ranked list, no headers.
      const scored = roleItems
        .map((item, i) => {
          const labelMatch = fuzzyMatch(q, item.label);
          if (labelMatch) {
            return { item, order: i, score: labelMatch.score + LABEL_WEIGHT, positions: labelMatch.positions };
          }
          const descMatch = fuzzyMatch(q, item.description);
          if (descMatch) {
            return { item, order: i, score: descMatch.score, positions: [] as number[] };
          }
          return null;
        })
        .filter((s): s is { item: PaletteItem; order: number; score: number; positions: number[] } => s !== null)
        .sort((a, b) => b.score - a.score || a.order - b.order)
        .slice(0, QUERY_CAP);

      const rows = scored.map(s => {
        const row: PaletteRow = {
          item: s.item,
          index: flat.length,
          segments: buildLabelSegments(s.item.label, s.positions),
        };
        flat.push(row);
        return row;
      });
      groups = rows.length ? [{ header: null, rows }] : [];
    }

    this.cachedGroups = groups;
    this.cachedItems = flat.map(r => r.item);
    if (this.selectedIndex > flat.length - 1) {
      this.selectedIndex = Math.max(0, flat.length - 1);
    }
  }

  get groups(): PaletteGroup[] {
    this.rebuild();
    return this.cachedGroups;
  }

  /** Flat, ranked list of selectable items — drives keyboard nav and Enter. */
  get items(): PaletteItem[] {
    this.rebuild();
    return this.cachedItems;
  }

  get hasResults(): boolean {
    return this.items.length > 0;
  }

  get isQuerying(): boolean {
    return this.query.trim().length > 0;
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
      return;
    }
    if (!this.isOpen) return;

    // aria-modal="true" promises the rest of the page is inert; without this,
    // Tab would walk straight out of the dialog and make that a lie.
    if (trapTabKey(event, this.dialogElement())) return;

    switch (event.key) {
      case 'Escape':
        this.close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.items.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        break;
      case 'Enter': {
        const item = this.items[this.selectedIndex];
        if (item) this.navigate(item);
        break;
      }
    }
  }

  /** Whatever had focus before the palette opened, so it can be handed back. */
  private previouslyFocused: HTMLElement | null = null;

  private dialogElement(): HTMLElement | null {
    return document.querySelector<HTMLElement>('.palette-modal');
  }

  open(): void {
    this.previouslyFocused = document.activeElement as HTMLElement | null;
    this.isOpen = true;
    this.query = '';
    this.selectedIndex = 0;
    setTimeout(() => {
      const input = document.getElementById('palette-search-input');
      if (input) input.focus();
    }, 30);
  }

  close(): void {
    this.isOpen = false;
    this.query = '';
    this.selectedIndex = 0;

    // Returning focus to the opener: without this, closing the palette drops the
    // keyboard user back at the top of the document, losing their place.
    const opener = this.previouslyFocused;
    this.previouslyFocused = null;
    if (opener && typeof opener.focus === 'function') {
      opener.focus();
    }
  }

  onSearchInput(event: Event): void {
    this.query = (event.target as HTMLInputElement).value;
    this.selectedIndex = 0;
  }

  navigate(item: PaletteItem): void {
    if (item.action) {
      this.runAction(item.action);
    } else if (item.route) {
      this.router.navigate([item.route]);
    }
    this.close();
  }

  private runAction(action: PaletteAction): void {
    switch (action) {
      case 'toggle-theme':
        this.themeService.toggleTheme();
        break;
      case 'sign-out':
        ['token', 'email', 'userType', 'userId', 'demoMode', 'displayName'].forEach(key =>
          removeStorage(key)
        );
        this.router.navigate(['/sign-in']);
        break;
    }
  }
}
