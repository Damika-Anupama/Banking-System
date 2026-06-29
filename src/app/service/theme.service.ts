import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkModeSubject = new BehaviorSubject<boolean>(false);
  public isDarkMode$: Observable<boolean> = this.isDarkModeSubject.asObservable();

  constructor() {
    const savedTheme = localStorage.getItem('theme');

    let isDark: boolean;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      // Honour the customer's explicit choice.
      isDark = savedTheme === 'dark';
    } else {
      // First visit (or invalid value): follow the OS colour-scheme preference.
      isDark = this.prefersDarkScheme();
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    this.isDarkModeSubject.next(isDark);
    this.applyTheme(isDark);
  }

  private prefersDarkScheme(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }

  toggleTheme(): void {
    const newTheme = !this.isDarkModeSubject.value;
    this.isDarkModeSubject.next(newTheme);
    this.applyTheme(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  }

  setTheme(isDark: boolean): void {
    this.isDarkModeSubject.next(isDark);
    this.applyTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    this.updateThemeColorMeta(isDark);
  }

  /** Keep the mobile browser chrome (address bar) in sync with the app theme. */
  private updateThemeColorMeta(isDark: boolean): void {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', isDark ? '#0f172a' : '#f8fafc');
    }
  }

  getCurrentTheme(): boolean {
    return this.isDarkModeSubject.value;
  }
}
