import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  detail?: string;
  /** Milliseconds until auto-dismiss. 0 keeps the toast until dismissed. */
  duration: number;
}

/** Errors stay until dismissed so a screen reader user can never miss one. */
const DEFAULT_DURATION: Record<ToastKind, number> = {
  success: 4000,
  info: 5000,
  warning: 7000,
  error: 0,
};

const MAX_VISIBLE = 4;

/**
 * Global toast notifications.
 *
 * Replaces the ad-hoc, blocking SweetAlert popups for non-critical feedback:
 * toasts are non-modal, stack, and are announced to assistive tech by the
 * toast host's live region.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsSubject = new BehaviorSubject<Toast[]>([]);
  readonly toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  constructor(private zone: NgZone) {}

  success(title: string, detail?: string, duration?: number): number {
    return this.show('success', title, detail, duration);
  }

  error(title: string, detail?: string, duration?: number): number {
    return this.show('error', title, detail, duration);
  }

  warning(title: string, detail?: string, duration?: number): number {
    return this.show('warning', title, detail, duration);
  }

  info(title: string, detail?: string, duration?: number): number {
    return this.show('info', title, detail, duration);
  }

  show(kind: ToastKind, title: string, detail?: string, duration?: number): number {
    const toast: Toast = {
      id: this.nextId++,
      kind,
      title,
      detail,
      duration: duration ?? DEFAULT_DURATION[kind],
    };

    const current = this.toastsSubject.value;

    // Collapse a repeated message (e.g. a retried request failing again) onto the
    // existing toast rather than stacking identical copies.
    const duplicate = current.find(
      (t) => t.kind === kind && t.title === title && t.detail === detail
    );
    if (duplicate) {
      this.scheduleDismiss(duplicate);
      return duplicate.id;
    }

    // Drop the oldest toast once the stack is full so it cannot grow without bound.
    const next = [...current, toast];
    while (next.length > MAX_VISIBLE) {
      const evicted = next.shift();
      if (evicted) this.clearTimer(evicted.id);
    }

    this.toastsSubject.next(next);
    this.scheduleDismiss(toast);
    return toast.id;
  }

  dismiss(id: number): void {
    this.clearTimer(id);
    this.toastsSubject.next(this.toastsSubject.value.filter((t) => t.id !== id));
  }

  clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.toastsSubject.next([]);
  }

  private scheduleDismiss(toast: Toast): void {
    this.clearTimer(toast.id);
    if (toast.duration <= 0) return;

    // Timers outside Angular keep an open toast from holding a zone task, which
    // would otherwise stall Protractor-style stability checks and e2e waits.
    this.zone.runOutsideAngular(() => {
      const timer = setTimeout(() => {
        this.zone.run(() => this.dismiss(toast.id));
      }, toast.duration);
      this.timers.set(toast.id, timer);
    });
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
