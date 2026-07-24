import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { SkeletonTableComponent } from './skeleton-table.component';

describe('SkeletonTableComponent', () => {
  let fixture: ComponentFixture<SkeletonTableComponent>;
  let component: SkeletonTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [SkeletonTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonTableComponent);
    component = fixture.componentInstance;
  });

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  it('mirrors the supplied columns so the layout does not shift when data lands', () => {
    component.columns = ['Reference', 'Date', 'Amount'];
    component.rows = 4;
    fixture.detectChanges();

    const headers = Array.from(host().querySelectorAll('th')).map((th) => th.textContent?.trim());
    expect(headers).toEqual(['Reference', 'Date', 'Amount']);

    expect(host().querySelectorAll('tbody tr').length).toBe(4);
    expect(host().querySelectorAll('tbody tr:first-child td').length).toBe(3);
  });

  it('announces a busy status to assistive tech', () => {
    component.label = 'Loading transaction ledger';
    fixture.detectChanges();

    const status = host().querySelector('[role="status"]')!;
    expect(status.getAttribute('aria-label')).toBe('Loading transaction ledger');
    expect(status.getAttribute('aria-busy')).toBe('true');
  });

  it('hides the decorative shimmer grid from assistive tech', () => {
    fixture.detectChanges();
    expect(host().querySelector('table')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('falls back to three columns when none are supplied', () => {
    fixture.detectChanges();
    expect(host().querySelectorAll('th').length).toBe(3);
  });

  it('does not render negative row counts', () => {
    component.rows = -2;
    fixture.detectChanges();
    expect(host().querySelectorAll('tbody tr').length).toBe(0);
  });

  it('varies bar widths so the placeholder reads as text, not a uniform grid', () => {
    component.columns = ['a', 'b', 'c'];
    component.rows = 3;
    fixture.detectChanges();

    const widths = new Set(
      Array.from(host().querySelectorAll<HTMLElement>('.skeleton-table__bar')).map(
        (bar) => bar.style.width
      )
    );
    expect(widths.size).toBeGreaterThan(1);
  });
});
