import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { ToastHostComponent } from './toast-host.component';
import { ToastService } from '../../../service/toast.service';

describe('ToastHostComponent', () => {
  let fixture: ComponentFixture<ToastHostComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [ToastHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastHostComponent);
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  it('renders nothing until a toast is raised', () => {
    expect(host().querySelectorAll('.toast').length).toBe(0);
  });

  it('renders a success toast in the polite live region', () => {
    toastService.success('Saved');
    fixture.detectChanges();

    const polite = host().querySelector('[aria-live="polite"]')!;
    expect(polite.querySelectorAll('.toast').length).toBe(1);
    expect(polite.textContent).toContain('Saved');
  });

  it('routes errors to the assertive live region so they interrupt', () => {
    toastService.error('Transfer failed', 'Insufficient funds');
    fixture.detectChanges();

    const assertive = host().querySelector('[aria-live="assertive"]')!;
    const polite = host().querySelector('[aria-live="polite"]')!;

    expect(assertive.querySelectorAll('.toast').length).toBe(1);
    expect(assertive.textContent).toContain('Insufficient funds');
    expect(polite.querySelectorAll('.toast').length).toBe(0);
  });

  it('dismisses a toast when its close button is activated', () => {
    toastService.error('Transfer failed');
    fixture.detectChanges();

    const close = host().querySelector<HTMLButtonElement>('.toast__close')!;
    expect(close.getAttribute('aria-label')).toBe('Dismiss notification: Transfer failed');

    close.click();
    fixture.detectChanges();

    expect(host().querySelectorAll('.toast').length).toBe(0);
  });
});
