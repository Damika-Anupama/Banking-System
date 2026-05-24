import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { ManagerHomeComponent } from '../../view/manager-dashboard/manager.home/manager.home.component';
import { ManagerAddEmployeeComponent } from '../../view/manager-dashboard/manager.add.employee/manager.add.employee.component';
import { ManagerLoanApprovalComponent } from '../../view/manager-dashboard/manager.loan.approval/manager.loan.approval.component';
import { ManagerSettingsComponent } from '../../view/manager-dashboard/manager.settings/manager.settings.component';
import { UnifiedDashboardComponent } from '../../shared/components/unified-dashboard/unified-dashboard.component';

// Configuration
import { DashboardConfig } from '../../shared/models/navigation-config.model';

// Dashboard configuration for manager
const managerDashboardConfig: DashboardConfig = {
  dashboardType: 'manager',
  logoRoute: '/manager-dashboard',
  navigationItems: [
    { label: 'Home', route: './manager-home', icon: 'fa-home', title: 'Home' },
    { label: 'Add Employee', route: './manager-add-employee', icon: 'fa-user-plus', title: 'Add Employee' },
    { label: 'Loan Approvals', route: './manager-loan-approval', icon: 'fa-handshake', title: 'Loan Approvals' }
  ]
};

const routes: Routes = [
  {
    path: '',
    component: UnifiedDashboardComponent,
    data: { preload: true, config: managerDashboardConfig },
    children: [
      {
        path: '',
        pathMatch: 'prefix',
        redirectTo: 'manager-home'
      },
      {
        path: 'manager-home',
        component: ManagerHomeComponent,
        title: 'Home'
      },
      {
        path: 'manager-add-employee',
        component: ManagerAddEmployeeComponent,
        title: 'Add Employee'
      },
      {
        path: 'manager-loan-approval',
        component: ManagerLoanApprovalComponent,
        title: 'Loan Approval'
      },
      {
        path: 'manager-settings',
        component: ManagerSettingsComponent,
        title: 'Settings'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManagerRoutingModule { }
