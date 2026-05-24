import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Routing
import { CustomerRoutingModule } from './customer-routing.module';

// Shared Module
import { SharedModule } from '../../shared/shared.module';

// Components
import { HomeComponent } from '../../view/customer-dashboard/home/home.component';
import { TransactionComponent } from '../../view/customer-dashboard/transaction/transaction.component';
import { FixedDepositComponent } from '../../view/customer-dashboard/fixed-deposit/fixed-deposit.component';
import { LoanComponent } from '../../view/customer-dashboard/loan/loan.component';
import { SettingsComponent } from '../../view/customer-dashboard/settings/settings.component';

// Services
import { UserService } from '../../service/customer/user.service';
import { TransactionService } from '../../service/customer/transaction.service';
import { FixedDepositService } from '../../service/customer/fixed-deposit.service';
import { LoanService } from '../../service/customer/loan.service';

/**
 * Customer Feature Module
 *
 * This module contains all customer-related functionality including:
 * - Dashboard home with account overview
 * - Money transfers and transactions
 * - Fixed deposit management
 * - Online loan applications
 * - Profile settings
 *
 * This module is lazy-loaded when a customer accesses /dashboard
 */
@NgModule({
  declarations: [
    HomeComponent,
    TransactionComponent,
    FixedDepositComponent,
    LoanComponent,
    SettingsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    HttpClientModule,
    CustomerRoutingModule
  ],
  providers: [
    UserService,
    TransactionService,
    FixedDepositService,
    LoanService
  ]
})
export class CustomerModule { }
