import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Toast, ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  const current = (): Toast[] => {
    let toasts: Toast[] = [];
    service.toasts$.subscribe((t) => (toasts = t)).unsubscribe();
    return toasts;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('starts empty', () => {
    expect(current()).toEqual([]);
  });

  it('adds a toast with the requested kind and copy', () => {
    service.success('Transfer complete', 'LKR 5,000.00 sent');

    const [toast] = current();
    expect(toast.kind).toBe('success');
    expect(toast.title).toBe('Transfer complete');
    expect(toast.detail).toBe('LKR 5,000.00 sent');
  });

  it('auto-dismisses a success toast once its duration elapses', fakeAsync(() => {
    service.success('Saved');
    expect(current().length).toBe(1);

    tick(4000);
    expect(current().length).toBe(0);
  }));

  it('keeps error toasts until they are dismissed', fakeAsync(() => {
    const id = service.error('Transfer failed');

    tick(60000);
    expect(current().length).toBe(1);

    service.dismiss(id);
    expect(current().length).toBe(0);
  }));

  it('collapses an identical repeated message onto the existing toast', () => {
    const first = service.info('Reconnecting');
    const second = service.info('Reconnecting');

    expect(first).toBe(second);
    expect(current().length).toBe(1);
  });

  it('evicts the oldest toast beyond the visible maximum', () => {
    service.info('one');
    service.info('two');
    service.info('three');
    service.info('four');
    service.info('five');

    const titles = current().map((t) => t.title);
    expect(titles).toEqual(['two', 'three', 'four', 'five']);
  });

  it('clear() removes every toast and cancels pending timers', fakeAsync(() => {
    service.success('Saved');
    service.clear();

    expect(current().length).toBe(0);
    tick(10000);
    expect(current().length).toBe(0);
  }));
});
