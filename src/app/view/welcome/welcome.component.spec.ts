/**
 * Unit Tests for WelcomeComponent
 *
 * Covers the animated count-up: prefers-reduced-motion shows final values
 * instantly, the rAF animation lands on the formatted targets, and the
 * animation frame is cancelled on destroy.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { WelcomeComponent } from './welcome.component';

describe('WelcomeComponent', () => {
  let component: WelcomeComponent;
  let fixture: ComponentFixture<WelcomeComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      declarations: [WelcomeComponent],
      imports: [CommonModule],
      providers: [{ provide: Router, useValue: mockRouter }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WelcomeComponent);
    component = fixture.componentInstance;
  });

  const finalDisplays = () => component.stats.map(s => s.display);

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows final formatted values immediately when reduced motion is preferred', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    const rafSpy = spyOn(window, 'requestAnimationFrame');

    component.ngOnInit();

    expect(finalDisplays()).toEqual(['14+', 'Rs. 4M+', '3', '99.9%']);
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('animates the count and lands on the formatted targets', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    const frames: FrameRequestCallback[] = [];
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });

    component.ngOnInit();

    // First frame establishes the start timestamp (progress 0).
    frames[0](1000);
    // Final frame at start + full duration drives progress to 1.
    frames[frames.length - 1](1000 + 1400);

    expect(finalDisplays()).toEqual(['14+', 'Rs. 4M+', '3', '99.9%']);
  });

  it('cancels the pending animation frame on destroy', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    spyOn(window, 'requestAnimationFrame').and.returnValue(42);
    const cancelSpy = spyOn(window, 'cancelAnimationFrame');

    component.ngOnInit();
    component.ngOnDestroy();

    expect(cancelSpy).toHaveBeenCalledWith(42);
  });

  it('navigates to sign-in on continue', () => {
    component.gotoSignin();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('sign-in');
  });
});
