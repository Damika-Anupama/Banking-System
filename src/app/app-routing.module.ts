import { Injectable, NgModule } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterModule, RouterStateSnapshot, Routes, TitleStrategy } from '@angular/router';

// Guards
import { DashboardGuard } from './guard/dashboard.guard';

// Error Pages
import { NotFoundComponent } from './view/not-found/not-found.component';
import { ServerErrorComponent } from './view/server-error/server-error.component';

/**
 * Main Application Routes
 *
 * All feature modules are lazy-loaded to improve initial load performance:
 * - Auth Module: Public authentication pages (welcome, sign-in, sign-up)
 * - Customer Module: Customer dashboard and features
 * - Employee Module: Employee dashboard and features
 * - Manager Module: Manager dashboard and features
 *
 * Benefits of Lazy Loading:
 * 1. Faster initial load time (smaller main bundle)
 * 2. Better code splitting (separate bundles per feature)
 * 3. Improved user experience (load only what's needed)
 * 4. Better maintainability (clear feature boundaries)
 */
const routes: Routes = [
  // Root redirect
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/welcome'
  },

  // Auth Module - Lazy Loaded
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },

  // Customer Dashboard - Lazy Loaded + Protected
  {
    path: 'dashboard',
    title: 'Dashboard',
    loadChildren: () => import('./features/customer/customer.module').then(m => m.CustomerModule),
    canActivate: [DashboardGuard]
  },

  // Employee Dashboard - Lazy Loaded + Protected
  {
    path: 'employee-dashboard',
    title: 'Employee Dashboard',
    loadChildren: () => import('./features/employee/employee.module').then(m => m.EmployeeModule),
    canActivate: [DashboardGuard]
  },

  // Manager Dashboard - Lazy Loaded + Protected
  {
    path: 'manager-dashboard',
    title: 'Manager Dashboard',
    loadChildren: () => import('./features/manager/manager.module').then(m => m.ManagerModule),
    canActivate: [DashboardGuard]
  },

  // Error Pages (not lazy loaded - always available)
  {
    path: 'not-found',
    component: NotFoundComponent,
    title: 'Page Not Found'
  },
  {
    path: 'server-error',
    component: ServerErrorComponent,
    title: 'Server Error'
  },

  // Wildcard route (404)
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Page Not Found'
  }
];

/**
 * Custom Title Strategy
 *
 * Builds scannable, page-first browser tab titles of the form:
 *   "Loan Approvals · Manager · Banking System"
 *   "Sign In · Banking System"
 *
 * Page name comes first so it stays readable when browser tabs are narrow,
 * and a role segment disambiguates same-named pages (e.g. Home/Settings)
 * across the customer, employee, and manager dashboards.
 */
@Injectable({ providedIn: 'root' })
export class TemplatePageTitleStrategy extends TitleStrategy {
  private static readonly BRAND = 'Banking System';

  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot) {
    const pageTitle = this.buildTitle(routerState);
    const area = this.areaFor(routerState.url);

    const segments = [pageTitle, area, TemplatePageTitleStrategy.BRAND].filter(
      (segment): segment is string => Boolean(segment)
    );

    // Fall back to a descriptive default if no route-level title was provided.
    this.title.setTitle(
      pageTitle ? segments.join(' · ') : `Secure Online Banking · ${TemplatePageTitleStrategy.BRAND}`
    );
  }

  private areaFor(url: string): string | null {
    if (url.startsWith('/manager-dashboard')) return 'Manager';
    if (url.startsWith('/employee-dashboard')) return 'Employee';
    if (url.startsWith('/dashboard')) return 'Online Banking';
    return null;
  }
}

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    { provide: TitleStrategy, useClass: TemplatePageTitleStrategy }
  ]
})
export class AppRoutingModule { }
