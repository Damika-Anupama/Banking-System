import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ManagerReportsComponent } from './manager.reports.component';
import { ThemeService } from '../../../service/theme.service';

describe('ManagerReportsComponent', () => {
  let theme$: BehaviorSubject<boolean>;
  let component: ManagerReportsComponent;

  beforeEach(() => {
    theme$ = new BehaviorSubject<boolean>(true);
    const themeService = { isDarkMode$: theme$.asObservable() } as ThemeService;
    component = new ManagerReportsComponent(themeService);
  });

  afterEach(() => component.ngOnDestroy());

  it('rebuilds the charts when the theme changes', fakeAsync(() => {
    const rerender = spyOn<any>(component, 'rerenderCharts');
    component.ngOnInit();
    tick();
    const initialCalls = rerender.calls.count();

    theme$.next(false);
    tick();

    // Chart colours are read at render time; without a rebuild the axis and
    // legend colours would stay in the previous theme.
    expect(rerender.calls.count()).toBe(initialCalls + 1);
  }));

  it('stops listening for theme changes once destroyed', fakeAsync(() => {
    const rerender = spyOn<any>(component, 'rerenderCharts');
    component.ngOnInit();
    tick();
    component.ngOnDestroy();

    const callsAtDestroy = rerender.calls.count();
    theme$.next(false);
    tick();

    expect(rerender.calls.count()).toBe(callsAtDestroy);
  }));
});
