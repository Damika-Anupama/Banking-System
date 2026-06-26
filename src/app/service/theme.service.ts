import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkModeSubject = new BehaviorSubject<boolean>(false);
  public isDarkMode$: Observable<boolean> = this.isDarkModeSubject.asObservable();

  constructor() {
    // Load theme from localStorage or default to light mode
    const savedTheme = localStorage.getItem('theme');

    // If no theme is saved, default to light mode and save it
    if (!savedTheme) {
      localStorage.setItem('theme', 'light');
    }

    const isDark = savedTheme === 'dark';
    this.isDarkModeSubject.next(isDark);
    this.applyTheme(isDark);
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
  }

  getCurrentTheme(): boolean {
    return this.isDarkModeSubject.value;
  }
}
