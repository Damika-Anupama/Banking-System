import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Toast, ToastService } from '../../../service/toast.service';

/**
 * Renders the global toast stack.
 *
 * Two live regions, because assertiveness is a property of the region and not
 * of the node inside it: errors and warnings go into the assertive region so
 * they interrupt, everything else into the polite one.
 */
@Component({
  selector: 'app-toast-host',
  standalone: false,
  templateUrl: './toast-host.component.html',
  styleUrls: ['./toast-host.component.scss'],
})
export class ToastHostComponent implements OnInit, OnDestroy {
  polite: Toast[] = [];
  assertive: Toast[] = [];

  private sub: Subscription | null = null;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.sub = this.toastService.toasts$.subscribe((toasts) => {
      this.assertive = toasts.filter((t) => t.kind === 'error' || t.kind === 'warning');
      this.polite = toasts.filter((t) => t.kind !== 'error' && t.kind !== 'warning');
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }

  trackById(_index: number, toast: Toast): number {
    return toast.id;
  }

  iconFor(kind: Toast['kind']): string {
    switch (kind) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '!';
      default:
        return 'i';
    }
  }
}
