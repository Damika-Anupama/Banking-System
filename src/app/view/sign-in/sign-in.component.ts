import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { seedDemoSession, DemoRole } from 'src/app/shared/demo-session';
import { ToastService } from 'src/app/service/toast.service';

@Component({
  selector: 'app-sign-in',
  standalone: false,
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements AfterViewInit, OnDestroy {
  @ViewChild('emailInput') emailInput?: ElementRef<HTMLInputElement>;
  email = '';
  password = '';
  isLoading = false;
  submitted = false;
  showPassword = false;
  capsLockOn = false;
  loadingDemo: 'CUSTOMER' | 'EMPLOYEE' | 'MANAGER' | null = null;
  errorMessage = '';
  private subscriptions: Subscription[] = [];

  constructor(private router: Router, private toastService: ToastService) {}

  ngAfterViewInit(): void {
    // Native autofocus only fires on a full page load, not on router navigation.
    this.emailInput?.nativeElement.focus();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  authenticate(isValid: boolean | null = true): void {
    this.submitted = true;

    if (!this.email || !this.password) {
      this.showValidationError('Email and password are required');
      return;
    }

    if (!isValid || !this.isValidEmail(this.email)) {
      this.showValidationError('Please enter a valid email address');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.openCustomerDashboard(this.email);
  }

  launchDemo(type: DemoRole): void {
    // Ignore repeat clicks while a workspace is already opening.
    if (this.loadingDemo) {
      return;
    }
    this.loadingDemo = type;
    const route = seedDemoSession(type);
    // Brief delay so the "opening workspace" feedback is visible before routing.
    this.subscriptions.push(
      timer(450).subscribe(() => this.router.navigate([route]))
    );
  }

  private handleAuthenticationSuccess(user: any): void {
    if (!user) {
      this.showAuthenticationError('Invalid response from server');
      return;
    }

    if (!user.token || !user.type) {
      this.showAuthenticationError('Invalid authentication credentials');
      return;
    }

    const route = this.getRouteForUserType(user.type);
    if (!route) {
      this.showAuthenticationError('Invalid user type');
      return;
    }

    try {
      localStorage.setItem('token', user.token);
      localStorage.setItem('email', this.email);
      localStorage.setItem('userType', user.type);
      localStorage.setItem('demoMode', 'false');
    } catch (error) {
      console.error('Error storing authentication data:', error);
      this.isLoading = false;
      this.errorMessage = 'Failed to store authentication data';
      this.toastService.error('Sign-in failed', this.errorMessage);
      return;
    }

    this.isLoading = false;
    this.errorMessage = '';
    this.router.navigate([route]);
  }

  private handleAuthenticationFailure(error: any): void {
    console.error('Authentication error:', error);
    const message = error?.error?.message || error?.message || 'Invalid email or password';
    this.isLoading = false;
    this.errorMessage = message;
    this.toastService.error('Sign-in failed', message);
  }

  private openCustomerDashboard(email: string): void {
    try {
      seedDemoSession('CUSTOMER', email);
    } catch (error) {
      console.error('Error storing authentication data:', error);
      this.isLoading = false;
      this.errorMessage = 'Failed to store authentication data';
      this.toastService.error('Sign-in failed', this.errorMessage);
      return;
    }

    this.isLoading = false;
    this.errorMessage = '';
    this.router.navigate(['/dashboard/home']);
  }

  private showValidationError(message: string): void {
    this.isLoading = false;
    this.errorMessage = message;
    // The offending field is already marked inline; this is just the summary.
    this.toastService.error('Check your details', message);
  }

  private showAuthenticationError(message: string): void {
    this.isLoading = false;
    this.errorMessage = message;
    this.toastService.error('Sign-in failed', message);
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private getRouteForUserType(type: string): string | null {
    switch (type) {
      case 'CUSTOMER':
        return '/dashboard/home';
      case 'EMPLOYEE':
        return '/employee-dashboard/employee-home';
      case 'MANAGER':
        return '/manager-dashboard/manager-home';
      default:
        return null;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}

