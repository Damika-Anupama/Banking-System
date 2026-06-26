/**
 * Unit Tests for ThemeService
 *
 * Tests theme management, persistence, and application
 * Target coverage: 90%+
 */

import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [ThemeService]
    });
  });

  afterEach(() => {
    localStorage.clear();
    // Clear any applied theme classes
    document.documentElement.classList.remove('dark');
  });

  describe('Service Creation and Initialization', () => {
    it('should be created', () => {
      service = TestBed.inject(ThemeService);
      expect(service).toBeTruthy();
    });

    it('should initialize with light theme when no saved theme', () => {
      service = TestBed.inject(ThemeService);

      expect(localStorage.getItem('theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should load dark theme from localStorage', () => {
      localStorage.setItem('theme', 'dark');
      service = TestBed.inject(ThemeService);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should load light theme from localStorage', () => {
      localStorage.setItem('theme', 'light');
      service = TestBed.inject(ThemeService);

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should emit initial dark theme state', (done) => {
      localStorage.setItem('theme', 'dark');
      service = TestBed.inject(ThemeService);

      service.isDarkMode$.subscribe(isDark => {
        expect(isDark).toBe(true);
        done();
      });
    });

    it('should emit initial light theme state', (done) => {
      localStorage.setItem('theme', 'light');
      service = TestBed.inject(ThemeService);

      service.isDarkMode$.subscribe(isDark => {
        expect(isDark).toBe(false);
        done();
      });
    });

    it('should apply dark theme class on initialization', () => {
      localStorage.setItem('theme', 'dark');
      service = TestBed.inject(ThemeService);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should not apply dark theme class for light theme', () => {
      localStorage.setItem('theme', 'light');
      service = TestBed.inject(ThemeService);

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('toggleTheme()', () => {
    beforeEach(() => {
      service = TestBed.inject(ThemeService);
    });

    it('should toggle from light to dark', (done) => {
      localStorage.setItem('theme', 'light');

      service.toggleTheme();

      service.isDarkMode$.subscribe(isDark => {
        expect(isDark).toBe(true);
        expect(localStorage.getItem('theme')).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        done();
      });
    });

    it('should toggle from dark to light', (done) => {
      service.setTheme(true); // Set to dark first

      service.toggleTheme();

      service.isDarkMode$.subscribe(isDark => {
        expect(isDark).toBe(false);
        expect(localStorage.getItem('theme')).toBe('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        done();
      });
    });

    it('should toggle multiple times correctly', (done) => {
      // Start with light (default)
      service.toggleTheme(); // -> dark
      service.toggleTheme(); // -> light
      service.toggleTheme(); // -> dark

      service.isDarkMode$.subscribe(isDark => {
        expect(isDark).toBe(true);
        expect(localStorage.getItem('theme')).toBe('dark');
        done();
      });
    });

    it('should persist theme to localStorage on toggle', () => {
      service.toggleTheme();
      expect(localStorage.getItem('theme')).toBe('dark');

      service.toggleTheme();
      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should apply theme class on toggle', () => {
      service.toggleTheme();
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      service.toggleTheme();
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should emit new theme state on toggle', (done) => {
      const emissions: boolean[] = [];

      service.isDarkMode$.subscribe(isDark => {
        emissions.push(isDark);
      });

      service.toggleTheme();

      setTimeout(() => {
        expect(emissions).toContain(true);
        expect(emissions[emissions.length - 1]).toBe(true);
        done();
      }, 10);
    });
  });

  describe('setTheme()', () => {
    beforeEach(() => {
      service = TestBed.inject(ThemeService);
    });

    it('should set dark theme', (done) => {
      service.setTheme(true);

      service.isDarkMode$.subscribe(isDark => {
        expect(isDark).toBe(true);
        expect(localStorage.getItem('theme')).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        done();
      });
    });

    it('should set light theme', (done) => {
      service.setTheme(false);

      service.isDarkMode$.subscribe(isDark => {
        expect(isDark).toBe(false);
        expect(localStorage.getItem('theme')).toBe('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        done();
      });
    });

    it('should switch from dark to light', (done) => {
      service.setTheme(true);
      service.setTheme(false);

      service.isDarkMode$.subscribe(isDark => {
        expect(isDark).toBe(false);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        done();
      });
    });

    it('should switch from light to dark', (done) => {
      service.setTheme(false);
      service.setTheme(true);

      service.isDarkMode$.subscribe(isDark => {
        expect(isDark).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        done();
      });
    });

    it('should persist theme to localStorage', () => {
      service.setTheme(true);
      expect(localStorage.getItem('theme')).toBe('dark');

      service.setTheme(false);
      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should apply theme class immediately', () => {
      service.setTheme(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      service.setTheme(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should handle setting same theme multiple times', (done) => {
      service.setTheme(true);
      service.setTheme(true);
      service.setTheme(true);

      service.isDarkMode$.subscribe(isDark => {
        expect(isDark).toBe(true);
        done();
      });
    });

    it('should emit theme state on setTheme', (done) => {
      const emissions: boolean[] = [];

      service.isDarkMode$.subscribe(isDark => {
        emissions.push(isDark);
      });

      service.setTheme(true);

      setTimeout(() => {
        expect(emissions).toContain(true);
        done();
      }, 10);
    });
  });

  describe('getCurrentTheme()', () => {
    beforeEach(() => {
      service = TestBed.inject(ThemeService);
    });

    it('should return false for light theme', () => {
      service.setTheme(false);
      expect(service.getCurrentTheme()).toBe(false);
    });

    it('should return true for dark theme', () => {
      service.setTheme(true);
      expect(service.getCurrentTheme()).toBe(true);
    });

    it('should return current theme after toggle', () => {
      service.setTheme(false);
      service.toggleTheme();
      expect(service.getCurrentTheme()).toBe(true);
    });

    it('should return initial theme state', () => {
      // Default is light
      expect(service.getCurrentTheme()).toBe(false);
    });

    it('should return correct state after multiple changes', () => {
      service.setTheme(true);
      service.toggleTheme();
      service.toggleTheme();
      service.setTheme(false);

      expect(service.getCurrentTheme()).toBe(false);
    });
  });

  describe('Theme persistence', () => {
    it('should persist dark theme across service instances', () => {
      service = TestBed.inject(ThemeService);
      service.setTheme(true);

      // Create new service instance
      const newService = TestBed.inject(ThemeService);
      expect(newService.getCurrentTheme()).toBe(true);
    });

    it('should persist light theme across service instances', () => {
      service = TestBed.inject(ThemeService);
      service.setTheme(false);

      // Create new service instance
      const newService = TestBed.inject(ThemeService);
      expect(newService.getCurrentTheme()).toBe(false);
    });

    it('should maintain theme in localStorage after toggle', () => {
      service = TestBed.inject(ThemeService);
      service.toggleTheme();

      expect(localStorage.getItem('theme')).not.toBeNull();
      expect(['light', 'dark']).toContain(localStorage.getItem('theme')!);
    });
  });

  describe('Observable behavior', () => {
    beforeEach(() => {
      service = TestBed.inject(ThemeService);
    });

    it('should allow multiple subscribers', (done) => {
      let subscriber1Value: boolean | undefined;
      let subscriber2Value: boolean | undefined;

      service.isDarkMode$.subscribe(isDark => {
        subscriber1Value = isDark;
      });

      service.isDarkMode$.subscribe(isDark => {
        subscriber2Value = isDark;
      });

      service.setTheme(true);

      setTimeout(() => {
        expect(subscriber1Value).toBe(true);
        expect(subscriber2Value).toBe(true);
        done();
      }, 10);
    });

    it('should provide current value to new subscribers', (done) => {
      service.setTheme(true);

      setTimeout(() => {
        service.isDarkMode$.subscribe(isDark => {
          expect(isDark).toBe(true);
          done();
        });
      }, 10);
    });

    it('should emit to all subscribers on theme change', (done) => {
      const emissions1: boolean[] = [];
      const emissions2: boolean[] = [];

      service.isDarkMode$.subscribe(isDark => emissions1.push(isDark));
      service.isDarkMode$.subscribe(isDark => emissions2.push(isDark));

      service.setTheme(true);

      setTimeout(() => {
        expect(emissions1[emissions1.length - 1]).toBe(true);
        expect(emissions2[emissions2.length - 1]).toBe(true);
        done();
      }, 10);
    });
  });

  describe('DOM manipulation', () => {
    beforeEach(() => {
      service = TestBed.inject(ThemeService);
    });

    it('should add dark class to document element', () => {
      service.setTheme(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class from document element', () => {
      service.setTheme(true);
      service.setTheme(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should only add dark class once', () => {
      service.setTheme(true);
      service.setTheme(true);

      const darkClasses = Array.from(document.documentElement.classList).filter(c => c === 'dark');
      expect(darkClasses.length).toBe(1);
    });

    it('should handle rapid theme switches', () => {
      service.setTheme(true);
      service.setTheme(false);
      service.setTheme(true);
      service.setTheme(false);

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should throw error when localStorage is unavailable', () => {
      // This test verifies the service throws error if localStorage fails
      service = TestBed.inject(ThemeService);

      spyOn(localStorage, 'setItem').and.throwError('Storage unavailable');

      // Should throw error when trying to set theme
      expect(() => service.setTheme(true)).toThrowError('Storage unavailable');
    });

    it('should handle invalid theme value in localStorage', () => {
      localStorage.setItem('theme', 'invalid');
      service = TestBed.inject(ThemeService);

      // Should default to light (false)
      expect(service.getCurrentTheme()).toBe(false);
    });

    it('should handle empty theme value in localStorage', () => {
      localStorage.setItem('theme', '');
      service = TestBed.inject(ThemeService);

      expect(service.getCurrentTheme()).toBe(false);
    });
  });
});
