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
 * Sets the browser tab title with a prefix for all routes
 */
@Injectable({ providedIn: 'root' })
export class TemplatePageTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot) {
    const title = this.buildTitle(routerState);
    if (title !== undefined) {
      this.title.setTitle(`Banking System | ${title}`);
    }
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
