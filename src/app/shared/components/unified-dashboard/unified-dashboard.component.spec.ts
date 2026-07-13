/**
 * Unit Tests for UnifiedDashboardComponent
 *
 * Focus: the shared back-to-top scroll behaviour and the "skip to main
 * content" accessibility helper. ngOnInit (theme/route/clock wiring) is not
 * exercised here — these are pure interaction helpers.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { UnifiedDashboardComponent } from './unified-dashboard.component';
import { ThemeService } from '../../../service/theme.service';

describe('UnifiedDashboardComponent', () => {
  let component: UnifiedDashboardComponent;
  let fixture: ComponentFixture<UnifiedDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UnifiedDashboardComponent],
      imports: [CommonModule],
      providers: [
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']) },
        { provide: ActivatedRoute, useValue: { data: of({ config: { dashboardType: 'customer', navigationItems: [] } }) } },
        { provide: ThemeService, useValue: { isDarkMode$: of(false), toggleTheme: () => {} } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UnifiedDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('navigation orientation', () => {
    // The real config declares routes RELATIVE ('./transaction') while
    // router.url is absolute. The first version of this test invented absolute
    // routes, so it passed against a breadcrumb that never rendered in the app.
    const navItems = [
      { icon: 'fa-home', label: 'Home', route: './home' },
      { icon: 'fa-list', label: 'Transactions', route: './transaction' },
      { icon: 'fa-vault', label: 'Fixed deposits', route: './fixed-deposit' },
    ];

    const atUrl = (url: string) => {
      const router = TestBed.inject(Router) as any;
      router.url = url;
      component.navigationItems = navItems as any;
    };

    it('names the page the user is currently on', () => {
      atUrl('/dashboard/transaction');

      expect(component.currentPageLabel).toBe('Transactions');
    });

    it('resolves a nested route to its section, not a shorter sibling', () => {
      atUrl('/dashboard/fixed-deposit/new');

      // '/dashboard' would also prefix-match if we took the first hit rather
      // than the longest one.
      expect(component.currentPageLabel).toBe('Fixed deposits');
    });

    it('falls back to no breadcrumb rather than guessing on an unknown route', () => {
      atUrl('/dashboard/somewhere-else');

      expect(component.currentPageLabel).toBe('');
    });

    it('names the dashboard the user is inside', () => {
      component.config = { dashboardType: 'manager', navigationItems: [], logoRoute: '/' } as any;
      expect(component.dashboardLabel).toBe('Manager dashboard');

      component.config = { dashboardType: 'customer', navigationItems: [], logoRoute: '/' } as any;
      expect(component.dashboardLabel).toBe('My accounts');
    });

    it('reports whether the mobile menu is open', () => {
      expect(component.isSidebarOpen).toBe(false);

      component.toggleSidebar();
      expect(component.isSidebarOpen).toBe(true);
    });
  });

  describe('mobile drawer focus management', () => {
    it('closes on Escape, so the drawer is not a trap without an exit', () => {
      component.openSidebar();
      expect(component.isSidebarOpen).toBe(true);

      component.onSidebarKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(component.isSidebarOpen).toBe(false);
    });

    it('ignores Escape when the drawer is already closed', () => {
      component.isSidebarOpen = false;

      component.onSidebarKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(component.isSidebarOpen).toBe(false);
    });

    it('hands focus back to whatever opened it', () => {
      const opener = document.createElement('button');
      document.body.appendChild(opener);
      opener.focus();

      component.openSidebar();
      component.closeSidebar();

      expect(document.activeElement).toBe(opener);

      document.body.removeChild(opener);
    });
  });

  describe('back-to-top', () => {
    it('reveals the button only after scrolling past 300px', () => {
      component.onContentScroll({ target: { scrollTop: 120, scrollTo: () => {} } } as unknown as Event);
      expect(component.showBackToTop).toBeFalse();

      component.onContentScroll({ target: { scrollTop: 450, scrollTo: () => {} } } as unknown as Event);
      expect(component.showBackToTop).toBeTrue();
    });

    it('smooth-scrolls the captured container to the top', () => {
      const el = { scrollTop: 800, scrollTo: jasmine.createSpy('scrollTo') };
      component.onContentScroll({ target: el } as unknown as Event);

      component.scrollToTop();

      expect(el.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('scrollToTop is a no-op before any scroll has been observed', () => {
      expect(() => component.scrollToTop()).not.toThrow();
    });
  });

  describe('focusMainContent', () => {
    afterEach(() => {
      document.getElementById('main-content')?.remove();
    });

    it('moves focus to the main content region', () => {
      const main = document.createElement('main');
      main.id = 'main-content';
      main.tabIndex = -1;
      document.body.appendChild(main);

      component.focusMainContent();

      expect(document.activeElement).toBe(main);
    });

    it('does not throw when the main region is absent', () => {
      expect(() => component.focusMainContent()).not.toThrow();
    });
  });
});
