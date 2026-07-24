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
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { WelcomeComponent } from './welcome.component';
import { ToastService } from 'src/app/service/toast.service';

describe('WelcomeComponent', () => {
  let component: WelcomeComponent;
  let fixture: ComponentFixture<WelcomeComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockToast: jasmine.SpyObj<ToastService>;
  let queryParams: Record<string, string>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);
    mockToast = jasmine.createSpyObj('ToastService', ['warning', 'error', 'info', 'success']);
    queryParams = {};

    await TestBed.configureTestingModule({
      declarations: [WelcomeComponent],
      imports: [CommonModule],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ToastService, useValue: mockToast },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { get queryParamMap() { return convertToParamMap(queryParams); } } },
        },
      ],
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

  describe('session-error explanations', () => {
    beforeEach(() => {
      spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    });

    it('explains an expired session instead of dropping the user silently', () => {
      queryParams = { error: 'token_expired' };
      component.ngOnInit();

      expect(mockToast.warning).toHaveBeenCalledWith(
        'Session expired',
        jasmine.stringMatching(/sign in again/i)
      );
      // The param is stripped so a refresh does not re-announce it.
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [], jasmine.objectContaining({ queryParams: {}, replaceUrl: true })
      );
    });

    it('stays quiet without an error param', () => {
      component.ngOnInit();
      expect(mockToast.warning).not.toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('ignores unknown error codes rather than toasting gibberish', () => {
      queryParams = { error: 'something_else' };
      component.ngOnInit();
      expect(mockToast.warning).not.toHaveBeenCalled();
    });
  });
});
