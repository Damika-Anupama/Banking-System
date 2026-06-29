import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

interface WelcomeStat {
  prefix: string;
  target: number;
  decimals: number;
  suffix: string;
  label: string;
  display: string;
}

@Component({
  selector: 'app-welcome',
  standalone: false,
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent implements OnInit, OnDestroy {
  stats: WelcomeStat[] = [
    { prefix: '', target: 14, decimals: 0, suffix: '+', label: 'Customers', display: '0+' },
    { prefix: 'Rs. ', target: 4, decimals: 0, suffix: 'M+', label: 'Assets managed', display: 'Rs. 0M+' },
    { prefix: '', target: 3, decimals: 0, suffix: '', label: 'Branch locations', display: '0' },
    { prefix: '', target: 99.9, decimals: 1, suffix: '%', label: 'Uptime', display: '0%' },
  ];

  private rafId: number | null = null;

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      this.stats.forEach((s) => (s.display = this.format(s, s.target)));
      return;
    }

    this.animateCounts();
  }

  private animateCounts(): void {
    const duration = 1400;
    let start: number | null = null;

    const step = (timestamp: number): void => {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic for a natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3);

      this.stats.forEach((s) => {
        s.display = this.format(s, s.target * eased);
      });
      this.cdr.markForCheck();

      if (progress < 1) {
        this.rafId = window.requestAnimationFrame(step);
      } else {
        this.rafId = null;
      }
    };

    this.rafId = window.requestAnimationFrame(step);
  }

  private format(stat: WelcomeStat, value: number): string {
    const rounded =
      stat.decimals > 0 ? value.toFixed(stat.decimals) : Math.round(value).toString();
    return `${stat.prefix}${rounded}${stat.suffix}`;
  }

  gotoSignin(): void {
    this.router.navigateByUrl('sign-in');
  }

  // Let users press Enter to continue
  @HostListener('window:keydown.enter', ['$event'])
  onEnterPress(event: Event): void {
    event.preventDefault();
    this.gotoSignin();
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
    }
  }
}
