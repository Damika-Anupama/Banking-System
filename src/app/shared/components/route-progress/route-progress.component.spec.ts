/**
 * Unit Tests for RouteProgressComponent
 *
 * Drives the component with a fake Router event stream and asserts the
 * loading-bar lifecycle (start -> trickle -> complete) for navigation
 * success, cancel, and error.
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import {
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import { Subject } from 'rxjs';
import { RouteProgressComponent } from './route-progress.component';

describe('RouteProgressComponent', () => {
  let component: RouteProgressComponent;
  let fixture: ComponentFixture<RouteProgressComponent>;
  let events$: Subject<unknown>;

  beforeEach(async () => {
    events$ = new Subject<unknown>();

    await TestBed.configureTestingModule({
      declarations: [RouteProgressComponent],
      imports: [CommonModule],
      providers: [{ provide: Router, useValue: { events: events$ } }],
    }).compileComponents();

    fixture = TestBed.createComponent(RouteProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // runs ngOnInit -> subscribes to router events
  });

  afterEach(() => component.ngOnDestroy());

  it('should create and start inactive', () => {
    expect(component).toBeTruthy();
    expect(component.active).toBeFalse();
    expect(component.progress).toBe(0);
  });

  it('activates and seeds progress on NavigationStart', () => {
    events$.next(new NavigationStart(1, '/dashboard/home'));
    expect(component.active).toBeTrue();
    expect(component.progress).toBeGreaterThan(0);
    expect(component.progress).toBeLessThan(100);
  });

  it('trickles toward but never reaches 90% while navigating', fakeAsync(() => {
    events$.next(new NavigationStart(1, '/x'));
    tick(220 * 6); // several trickle ticks
    expect(component.progress).toBeGreaterThan(12);
    expect(component.progress).toBeLessThanOrEqual(90);

    // Clean up the running trickle + completion timer.
    events$.next(new NavigationEnd(1, '/x', '/x'));
    tick(320);
  }));

  it('snaps to 100% then resets after NavigationEnd', fakeAsync(() => {
    events$.next(new NavigationStart(1, '/x'));
    events$.next(new NavigationEnd(1, '/x', '/x'));
    expect(component.progress).toBe(100);

    tick(320);
    expect(component.active).toBeFalse();
    expect(component.progress).toBe(0);
  }));

  it('completes on NavigationCancel so the bar never sticks', fakeAsync(() => {
    events$.next(new NavigationStart(1, '/x'));
    events$.next(new NavigationCancel(1, '/x', 'guard blocked'));
    expect(component.progress).toBe(100);
    tick(320);
    expect(component.active).toBeFalse();
  }));

  it('completes on NavigationError so the bar never sticks', fakeAsync(() => {
    events$.next(new NavigationStart(1, '/x'));
    events$.next(new NavigationError(1, '/x', new Error('boom')));
    expect(component.progress).toBe(100);
    tick(320);
    expect(component.active).toBeFalse();
  }));
});
