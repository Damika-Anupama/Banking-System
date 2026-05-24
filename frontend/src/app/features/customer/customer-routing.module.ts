import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { HomeComponent } from '../../view/customer-dashboard/home/home.component';
import { TransactionComponent } from '../../view/customer-dashboard/transaction/transaction.component';
import { FixedDepositComponent } from '../../view/customer-dashboard/fixed-deposit/fixed-deposit.component';
import { LoanComponent } from '../../view/customer-dashboard/loan/loan.component';
import { SettingsComponent } from '../../view/customer-dashboard/settings/settings.component';
import { UnifiedDashboardComponent } from '../../shared/components/unified-dashboard/unified-dashboard.component';

// Configuration
import { DashboardConfig } from '../../shared/models/navigation-config.model';

// Dashboard configuration for customer
const customerDashboardConfig: DashboardConfig = {
  dashboardType: 'customer',
  logoRoute: '/dashboard',
  navigationItems: [
    { label: 'Home', route: './home', icon: 'fa-home', title: 'Home' },
    { label: 'Transaction', route: './transaction', icon: 'fa-exchange-alt', title: 'Transaction' },
    { label: 'Fixed Deposit', route: './fixed-deposit', icon: 'fa-piggy-bank', title: 'Fixed Deposit' },
    { label: 'Loan', route: './loan', icon: 'fa-hand-holding-usd', title: 'Loan' }
  ]
};

const routes: Routes = [
  {
    path: '',
    component: UnifiedDashboardComponent,
    data: { preload: true, config: customerDashboardConfig },
    children: [
      {
        path: '',
        pathMatch: 'prefix',
        redirectTo: 'home'
      },
      {
        path: 'home',
        component: HomeComponent,
        title: 'Home'
      },
      {
        path: 'transaction',
        component: TransactionComponent,
        title: 'Transaction'
      },
      {
        path: 'fixed-deposit',
        component: FixedDepositComponent,
        title: 'Fixed Deposit'
      },
      {
        path: 'loan',
        component: LoanComponent,
        title: 'Loan'
      },
      {
        path: 'settings',
        component: SettingsComponent,
        title: 'Settings'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomerRoutingModule { }
