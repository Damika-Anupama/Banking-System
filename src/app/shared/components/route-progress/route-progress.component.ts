import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import {
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
  Event as RouterEvent,
} from '@angular/router';
import { Subscription } from 'rxjs';

/**
 * Slim NProgress-style loading bar shown at the very top of the viewport
 * while the router resolves a navigation (including lazy-loaded modules).
 */
@Component({
  selector: 'app-route-progress',
  standalone: false,
  templateUrl: './route-progress.component.html',
  styleUrls: ['./route-progress.component.scss'],
})
export class RouteProgressComponent implements OnInit, OnDestroy {
  active = false;
  progress = 0;

  private routerSub: Subscription | null = null;
  private trickleId: ReturnType<typeof setInterval> | null = null;
  private completeTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private router: Router, private zone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.routerSub = this.router.events.subscribe((event: RouterEvent) => {
      if (event instanceof NavigationStart) {
        this.start();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.complete();
      }
    });
  }

  private start(): void {
    if (this.completeTimeout) {
      clearTimeout(this.completeTimeout);
      this.completeTimeout = null;
    }
    this.active = true;
    this.progress = 12;
    this.cdr.markForCheck();

    this.clearTrickle();
    // Run the trickle outside Angular so it does not trip change detection on every tick.
    this.zone.runOutsideAngular(() => {
      this.trickleId = setInterval(() => {
        this.zone.run(() => {
          // Ease toward 90% but never reach it until navigation actually ends.
          const remaining = 90 - this.progress;
          this.progress += Math.max(remaining * 0.12, 0.6);
          if (this.progress > 90) this.progress = 90;
          this.cdr.markForCheck();
        });
      }, 220);
    });
  }

  private complete(): void {
    this.clearTrickle();
    this.progress = 100;
    this.cdr.markForCheck();
    this.completeTimeout = setTimeout(() => {
      this.active = false;
      this.progress = 0;
      this.cdr.markForCheck();
    }, 320);
  }

  private clearTrickle(): void {
    if (this.trickleId) {
      clearInterval(this.trickleId);
      this.trickleId = null;
    }
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.clearTrickle();
    if (this.completeTimeout) clearTimeout(this.completeTimeout);
  }
}
