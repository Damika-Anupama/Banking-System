import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { EmployeePerformanceComponent } from './employee.performance.component';
import { ThemeService } from '../../../service/theme.service';

describe('EmployeePerformanceComponent', () => {
  let theme$: BehaviorSubject<boolean>;
  let component: EmployeePerformanceComponent;

  beforeEach(() => {
    theme$ = new BehaviorSubject<boolean>(true);
    const themeService = { isDarkMode$: theme$.asObservable() } as ThemeService;
    component = new EmployeePerformanceComponent(themeService);
  });

  afterEach(() => component.ngOnDestroy());

  it('rebuilds the weekly chart when the theme changes', fakeAsync(() => {
    const render = spyOn<any>(component, 'renderWeeklyChart');
    component.ngOnInit();
    tick();
    const initialCalls = render.calls.count();

    theme$.next(false);
    tick();

    expect(render.calls.count()).toBe(initialCalls + 1);
  }));

  it('stops listening for theme changes once destroyed', fakeAsync(() => {
    const render = spyOn<any>(component, 'renderWeeklyChart');
    component.ngOnInit();
    tick();
    component.ngOnDestroy();

    const callsAtDestroy = render.calls.count();
    theme$.next(false);
    tick();

    expect(render.calls.count()).toBe(callsAtDestroy);
  }));
});
