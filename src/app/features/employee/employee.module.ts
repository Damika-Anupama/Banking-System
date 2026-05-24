import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Routing
import { EmployeeRoutingModule } from './employee-routing.module';

// Shared Module
import { SharedModule } from '../../shared/shared.module';

// Components
import { EmployeeHomeComponent } from '../../view/employee-dashboard/employee.home/employee.home.component';
import { EmployeeCreateLoanComponent } from '../../view/employee-dashboard/employee.create.loan/employee.create.loan.component';
import { EmployeeRegisterCustomerComponent } from '../../view/employee-dashboard/employee.register.customer/employee.register.customer.component';
import { EmployeeWithdrawalComponent } from '../../view/employee-dashboard/employee.withdrawal/employee.withdrawal.component';
import { EmployeeSettingsComponent } from '../../view/employee-dashboard/employee.settings/employee.settings.component';

// Services
import { EmployeeHomeService } from '../../service/employee/employee.home.service';
import { ManualLoanService } from '../../service/employee/manual.loan.service';
import { RegisterCustomerService } from '../../service/employee/register.customer.service';
import { WithdrawalService } from '../../service/employee/withdrawal.service';

/**
 * Employee Feature Module
 *
 * This module contains all employee-related functionality including:
 * - Employee dashboard home
 * - Manual loan creation for walk-in customers
 * - Customer registration
 * - Cash withdrawal processing
 * - Employee profile settings
 *
 * This module is lazy-loaded when an employee accesses /employee-dashboard
 */
@NgModule({
  declarations: [
    EmployeeHomeComponent,
    EmployeeCreateLoanComponent,
    EmployeeRegisterCustomerComponent,
    EmployeeWithdrawalComponent,
    EmployeeSettingsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    HttpClientModule,
    EmployeeRoutingModule
  ],
  providers: [
    EmployeeHomeService,
    ManualLoanService,
    RegisterCustomerService,
    WithdrawalService
  ]
})
export class EmployeeModule { }
