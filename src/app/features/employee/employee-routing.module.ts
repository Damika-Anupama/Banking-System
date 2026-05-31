import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { EmployeeHomeComponent } from '../../view/employee-dashboard/employee.home/employee.home.component';
import { EmployeeCreateLoanComponent } from '../../view/employee-dashboard/employee.create.loan/employee.create.loan.component';
import { EmployeeRegisterCustomerComponent } from '../../view/employee-dashboard/employee.register.customer/employee.register.customer.component';
import { EmployeeWithdrawalComponent } from '../../view/employee-dashboard/employee.withdrawal/employee.withdrawal.component';
import { EmployeeDepositComponent } from '../../view/employee-dashboard/employee.deposit/employee.deposit.component';
import { EmployeeCustomer360Component } from '../../view/employee-dashboard/employee.customer360/employee.customer360.component';
import { EmployeeSettingsComponent } from '../../view/employee-dashboard/employee.settings/employee.settings.component';
import { UnifiedDashboardComponent } from '../../shared/components/unified-dashboard/unified-dashboard.component';

// Configuration
import { DashboardConfig } from '../../shared/models/navigation-config.model';

// Dashboard configuration for employee
const employeeDashboardConfig: DashboardConfig = {
  dashboardType: 'employee',
  logoRoute: '/employee-dashboard',
  navigationItems: [
    { label: 'Home', route: './employee-home', icon: 'fa-home', title: 'Home' },
    { label: 'Customer 360', route: './employee-customer-360', icon: 'fa-user-magnifying-glass', title: 'Customer 360' },
    { label: 'Deposit', route: './employee-deposit', icon: 'fa-money-bill-trend-up', title: 'Deposit' },
    { label: 'Withdrawal', route: './employee-withdraw', icon: 'fa-money-bill-wave', title: 'Withdrawal' },
    { label: 'Manual Loan', route: './employee-create-loan', icon: 'fa-hand-holding-usd', title: 'Manual Loan' },
    { label: 'Register Customer', route: './employee-register-customer', icon: 'fa-user-plus', title: 'Register Customer' }
  ]
};

const routes: Routes = [
  {
    path: '',
    component: UnifiedDashboardComponent,
    data: { preload: true, config: employeeDashboardConfig },
    children: [
      {
        path: '',
        pathMatch: 'prefix',
        redirectTo: 'employee-home'
      },
      {
        path: 'employee-home',
        component: EmployeeHomeComponent,
        title: 'Home'
      },
      {
        path: 'employee-create-loan',
        component: EmployeeCreateLoanComponent,
        title: 'Manual Loan Creation'
      },
      {
        path: 'employee-register-customer',
        component: EmployeeRegisterCustomerComponent,
        title: 'Register Customer'
      },
      {
        path: 'employee-withdraw',
        component: EmployeeWithdrawalComponent,
        title: 'Withdraw'
      },
      {
        path: 'employee-deposit',
        component: EmployeeDepositComponent,
        title: 'Cash Deposit'
      },
      {
        path: 'employee-customer-360',
        component: EmployeeCustomer360Component,
        title: 'Customer 360'
      },
      {
        path: 'employee-settings',
        component: EmployeeSettingsComponent,
        title: 'Settings'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmployeeRoutingModule { }
