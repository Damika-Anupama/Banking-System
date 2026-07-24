/**
 * Unit Tests for CommandPaletteComponent
 *
 * Focus: role-based item filtering and the new quick-action commands
 * (toggle theme, sign out).
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import {
  CommandPaletteComponent,
  fuzzyMatch,
  buildLabelSegments,
} from './command-palette.component';
import { ThemeService } from '../../../service/theme.service';

describe('CommandPaletteComponent', () => {
  let component: CommandPaletteComponent;
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockTheme: jasmine.SpyObj<ThemeService>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockTheme = jasmine.createSpyObj('ThemeService', ['toggleTheme']);

    await TestBed.configureTestingModule({
      declarations: [CommandPaletteComponent],
      imports: [CommonModule],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ThemeService, useValue: mockTheme },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('role-based items', () => {
    it('shows only public items and the global theme action when signed out', () => {
      component.query = 'theme';
      const labels = component.items.map(i => i.label);
      expect(labels).toContain('Toggle theme');
    });

    it('exposes Sign out for a signed-in customer', () => {
      localStorage.setItem('userType', 'CUSTOMER');
      component.query = 'sign out';
      expect(component.items.some(i => i.label === 'Sign out')).toBeTrue();
    });

    it('does not expose Sign out when signed out', () => {
      component.query = 'sign out';
      expect(component.items.some(i => i.label === 'Sign out')).toBeFalse();
    });
  });

  describe('quick actions', () => {
    it('toggle-theme action calls ThemeService and closes the palette', () => {
      component.isOpen = true;
      component.navigate({
        label: 'Toggle theme', description: '', icon: '', group: 'Quick actions', action: 'toggle-theme', roles: ['*'],
      });
      expect(mockTheme.toggleTheme).toHaveBeenCalledTimes(1);
      expect(component.isOpen).toBeFalse();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('sign-out action clears the session and routes to sign-in', () => {
      localStorage.setItem('token', 'abc');
      localStorage.setItem('userType', 'CUSTOMER');
      localStorage.setItem('demoMode', 'true');

      component.navigate({
        label: 'Sign out', description: '', icon: '', group: 'Quick actions', action: 'sign-out',
        roles: ['CUSTOMER', 'EMPLOYEE', 'MANAGER', 'DEMO'],
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('userType')).toBeNull();
      expect(localStorage.getItem('demoMode')).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/sign-in']);
    });

    it('navigation items still route by path', () => {
      component.navigate({
        label: 'Loans', description: '', icon: '', group: 'Pages', route: '/dashboard/loan', roles: ['CUSTOMER'],
      });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/loan']);
    });
  });
  describe('fuzzy scorer', () => {
    it('scores an exact prefix above a scattered subsequence', () => {
      const prefix = fuzzyMatch('cap', 'Capture');
      const scattered = fuzzyMatch('cap', 'Command palette');
      expect(prefix).not.toBeNull();
      expect(scattered).not.toBeNull();
      expect(prefix!.score).toBeGreaterThan(scattered!.score);
    });

    it('returns null when not every query character is present in order', () => {
      expect(fuzzyMatch('xyz', 'Loans')).toBeNull();
      // "loans" has the letters but not in the order l-o-n-a
      expect(fuzzyMatch('lona', 'Loans')).toBeNull();
    });

    it('ranks an exact-prefix item above a word-boundary match in results', () => {
      localStorage.setItem('demoMode', 'true'); // DEMO sees every section
      component.query = 'loan';
      const labels = component.items.map(i => i.label);
      expect(labels).toContain('Loans');
      expect(labels).toContain('Create loan');
      // "Loans" is an exact prefix of the query; "Create loan" is not.
      expect(labels.indexOf('Loans')).toBeLessThan(labels.indexOf('Create loan'));
    });
  });

  describe('highlight segments', () => {
    it('marks matched label characters and leaves the rest unmarked', () => {
      const match = fuzzyMatch('loa', 'Loans');
      const segments = buildLabelSegments('Loans', match!.positions);
      const matched = segments.filter(s => s.matched).map(s => s.text).join('');
      const plain = segments.filter(s => !s.matched).map(s => s.text).join('');
      expect(matched).toBe('Loa');
      expect(plain).toBe('ns');
      // Segments always reconstruct the original label.
      expect(segments.map(s => s.text).join('')).toBe('Loans');
    });

    it('returns a single unmatched segment when there are no matches', () => {
      expect(buildLabelSegments('Loans', [])).toEqual([{ text: 'Loans', matched: false }]);
    });
  });

  describe('grouping and indexing', () => {
    it('shows group headers when browsing (empty query)', () => {
      localStorage.setItem('demoMode', 'true');
      component.query = '';
      const headers = component.groups.map(g => g.header).filter(h => h !== null);
      expect(headers.length).toBeGreaterThan(1);
      expect(headers).toContain('Customer');
    });

    it('shows a single flat list with no headers when querying', () => {
      localStorage.setItem('demoMode', 'true');
      component.query = 'loan';
      expect(component.groups.length).toBe(1);
      expect(component.groups.every(g => g.header === null)).toBeTrue();
    });

    it('assigns keyboard indices across rows only, skipping headers', () => {
      localStorage.setItem('demoMode', 'true');
      component.query = '';
      const rowCount = component.groups.reduce((n, g) => n + g.rows.length, 0);
      // Flat selectable list length must equal the total row count (headers excluded)...
      expect(component.items.length).toBe(rowCount);
      // ...and indices must be a contiguous 0..n-1 sequence over selectable rows.
      const indices = component.groups.flatMap(g => g.rows.map(r => r.index));
      expect(indices).toEqual(component.items.map((_, i) => i));
    });

    it('ArrowDown moves selection across items and never lands on a header', () => {
      localStorage.setItem('demoMode', 'true');
      component.open();
      component.query = '';
      component.selectedIndex = 0;
      component.onGlobalKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(component.selectedIndex).toBe(1);
      expect(component.items[component.selectedIndex]).toBeTruthy();
    });
  });

  describe('footer hints', () => {
    it('no longer advertises the non-functional "?" shortcut', () => {
      component.isOpen = true;
      fixture.detectChanges();
      const footer = fixture.nativeElement.querySelector('.palette-footer');
      expect(footer).toBeTruthy();
      expect(footer.textContent).not.toContain('Shortcuts');
      // The accurate hints stay.
      expect(footer.textContent).toContain('Navigate');
      expect(footer.textContent).toContain('Close');
    });
  });

  describe('focus management', () => {
    it('hands focus back to whatever opened it', (done) => {
      const opener = document.createElement('button');
      document.body.appendChild(opener);
      opener.focus();

      component.open();
      expect(component.isOpen).toBe(true);

      component.close();

      // Without this, closing the palette drops a keyboard user at the top of
      // the document, losing their place entirely.
      expect(document.activeElement).toBe(opener);

      document.body.removeChild(opener);
      done();
    });

    it('closes on Escape', () => {
      component.open();

      component.onGlobalKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(component.isOpen).toBe(false);
    });

    it('ignores Escape when it is not open', () => {
      component.isOpen = false;

      component.onGlobalKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(component.isOpen).toBe(false);
    });
  });

});
