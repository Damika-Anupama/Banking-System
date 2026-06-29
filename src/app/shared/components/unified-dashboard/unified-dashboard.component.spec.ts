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
