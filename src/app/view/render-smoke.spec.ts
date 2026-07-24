import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA, Type } from '@angular/core';
import Swal from 'sweetalert2';

import { SignUpComponent } from './sign-up/sign-up.component';
import { ManagerAnnouncementsComponent } from './manager-dashboard/manager.announcements/manager.announcements.component';
import { ManagerReportsComponent } from './manager-dashboard/manager.reports/manager.reports.component';
import { ManagerProductsComponent } from './manager-dashboard/manager.products/manager.products.component';
import { ManagerAuditLogComponent } from './manager-dashboard/manager.audit-log/manager.audit-log.component';
import { EmployeeCustomer360Component } from './employee-dashboard/employee.customer360/employee.customer360.component';
import { EmployeeServiceRequestsComponent } from './employee-dashboard/employee.service-requests/employee.service-requests.component';
import { EmployeePerformanceComponent } from './employee-dashboard/employee.performance/employee.performance.component';

// Components whose specs exercise logic but never render the template.
import { NotFoundComponent } from './not-found/not-found.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { ServerErrorComponent } from './server-error/server-error.component';
import { SettingsComponent } from './customer-dashboard/settings/settings.component';
import { PaymentsComponent } from './customer-dashboard/payments/payments.component';
import { CardsComponent } from './customer-dashboard/cards/cards.component';
import { FixedDepositComponent } from './customer-dashboard/fixed-deposit/fixed-deposit.component';
import { ManagerEmployeesComponent } from './manager-dashboard/manager.employees/manager.employees.component';
import { ManagerLoanApprovalComponent } from './manager-dashboard/manager.loan.approval/manager.loan.approval.component';
import { EmployeeChequeClearingComponent } from './employee-dashboard/employee.cheque-clearing/employee.cheque-clearing.component';
import { EmployeeDepositComponent } from './employee-dashboard/employee.deposit/employee.deposit.component';
import { EmployeeHomeComponent } from './employee-dashboard/employee.home/employee.home.component';
import { EmployeeOpenAccountComponent } from './employee-dashboard/employee.open-account/employee.open-account.component';
import { EmployeeSettingsComponent } from './employee-dashboard/employee.settings/employee.settings.component';

/**
 * Renders each of these components for real.
 *
 * The suite was passing 1478 tests while the transaction ledger threw on every
 * render, because no test had ever rendered it: an unbound trackBy method is
 * invisible to a test that only pokes at component state. These components had
 * no spec at all, so nothing had ever mounted their templates.
 *
 * The assertion is deliberately weak — "it renders, and produces content".
 * Anything a template can throw on (a bad binding, a missing pipe, an unbound
 * function) fails here, which is precisely the class of bug that was hiding.
 */
describe('view render smoke tests', () => {
  const components: Type<unknown>[] = [
    SignUpComponent,
    ManagerAnnouncementsComponent,
    ManagerReportsComponent,
    ManagerProductsComponent,
    ManagerAuditLogComponent,
    EmployeeCustomer360Component,
    EmployeeServiceRequestsComponent,
    EmployeePerformanceComponent,

    NotFoundComponent,
    WelcomeComponent,
    ServerErrorComponent,
    SettingsComponent,
    PaymentsComponent,
    CardsComponent,
    FixedDepositComponent,
    ManagerEmployeesComponent,
    ManagerLoanApprovalComponent,
    EmployeeChequeClearingComponent,
    EmployeeDepositComponent,
    EmployeeHomeComponent,
    EmployeeOpenAccountComponent,
    EmployeeSettingsComponent,
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: components,
      imports: [
        CommonModule,
        FormsModule,
        RouterTestingModule.withRoutes([]),
        HttpClientTestingModule,
      ],
      // Child components (skeleton table, etc.) are covered by their own specs.
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false }) as any);
  });

  components.forEach((component) => {
    it(`${component.name} renders without throwing`, () => {
      let fixture: ComponentFixture<unknown> | null = null;

      expect(() => {
        fixture = TestBed.createComponent(component);
        fixture.detectChanges();
      }).not.toThrow();

      const host = fixture!.nativeElement as HTMLElement;
      expect(host.textContent?.trim().length)
        .withContext(`${component.name} rendered an empty template`)
        .toBeGreaterThan(0);
    });
  });

  /**
   * The ledger crash only fired once a *row* rendered — an empty table would
   * have sailed past a smoke test. These components seed their own demo rows,
   * so this asserts the harness actually walks a populated *ngFor rather than
   * just mounting an empty shell.
   */
  const seeded: Type<unknown>[] = [
    ManagerEmployeesComponent,
    EmployeeChequeClearingComponent,
    EmployeeDepositComponent,
    EmployeeServiceRequestsComponent,
    ManagerAuditLogComponent,
  ];

  seeded.forEach((component) => {
    it(`${component.name} renders its rows, not just an empty table`, fakeAsync(() => {
      const fixture = TestBed.createComponent(component);
      fixture.detectChanges();

      // Some of these pages intentionally hold a loading skeleton for a beat
      // (an `isLoading` flag cleared by a short setTimeout) before the table
      // mounts. Flush that gate uniformly so the seeded rows are actually in
      // the DOM — and so future skeleton delays don't silently re-break this.
      tick(300);
      fixture.detectChanges();

      const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
      expect(rows.length)
        .withContext(`${component.name} rendered no rows, so its *ngFor was never walked`)
        .toBeGreaterThan(0);
    }));
  });
});
