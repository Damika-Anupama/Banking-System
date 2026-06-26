import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Routing
import { AuthRoutingModule } from './auth-routing.module';

// Shared Module
import { SharedModule } from '../../shared/shared.module';

// Components
import { WelcomeComponent } from '../../view/welcome/welcome.component';
import { SignInComponent } from '../../view/sign-in/sign-in.component';
import { SignUpComponent } from '../../view/sign-up/sign-up.component';

// Services
import { UserService } from '../../service/customer/user.service';

/**
 * Auth Feature Module
 *
 * This module handles all authentication-related functionality including:
 * - Welcome/Landing page
 * - User sign-in
 * - User sign-up/registration
 *
 * This module is lazy-loaded to improve initial app load time.
 */
@NgModule({
  declarations: [
    WelcomeComponent,
    SignInComponent,
    SignUpComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    HttpClientModule,
    AuthRoutingModule
  ],
  providers: [
    UserService
  ]
})
export class AuthModule { }
