import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { seedDemoSession, DemoRole } from 'src/app/shared/demo-session';
import { ToastService } from 'src/app/service/toast.service';

/** Why the dashboard guard sent the user here, in words a person can act on. */
const SESSION_ERROR_MESSAGES: Record<string, { title: string; detail: string }> = {
  token_expired: { title: 'Session expired', detail: 'Your session timed out. Sign in again to continue.' },
  no_token: { title: 'Sign-in required', detail: 'That page needs a signed-in session.' },
  invalid_token: { title: 'Session ended', detail: 'Your session was no longer valid. Sign in again to continue.' },
  auth_error: { title: 'Session ended', detail: 'Something went wrong while checking your session. Sign in again.' },
};

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
  private navigationTimer: ReturnType<typeof setTimeout> | null = null;
  loadingDemo: DemoRole | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  /**
   * The guard redirects here with ?error=… when it rejects a session; without
   * this, the user lands on the marketing page with no explanation.
   */
  private surfaceSessionError(): void {
    const code = this.route.snapshot.queryParamMap.get('error');
    const message = code ? SESSION_ERROR_MESSAGES[code] : undefined;
    if (!message) return;

    this.toastService.warning(message.title, message.detail);
    // Strip the param so a refresh or bookmark does not re-announce it.
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  /** One-click role demo, identical to the launchers on the sign-in screen. */
  launchDemo(type: DemoRole): void {
    if (this.loadingDemo) {
      return;
    }
    this.loadingDemo = type;
    const route = seedDemoSession(type);
    // Brief delay so the "opening workspace" feedback is visible before routing.
    this.navigationTimer = setTimeout(() => this.router.navigate([route]), 450);
  }

  ngOnInit(): void {
    this.surfaceSessionError();

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
    // Enter on a focused button or link must activate that control, not
    // hijack the keypress into the sign-in redirect.
    const target = event.target as HTMLElement | null;
    if (target && target.closest('button, a, input, select, textarea')) {
      return;
    }
    event.preventDefault();
    this.gotoSignin();
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
    }
    if (this.navigationTimer !== null) {
      clearTimeout(this.navigationTimer);
    }
  }
}
