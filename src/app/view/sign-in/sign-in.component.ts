import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sign-in',
  standalone: false,
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnDestroy {
  email = '';
  password = '';
  isLoading = false;
  submitted = false;
  errorMessage = '';
  private subscriptions: Subscription[] = [];

  constructor(private router: Router) {}

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

  launchDemo(type: 'CUSTOMER' | 'EMPLOYEE' | 'MANAGER'): void {
    const demoProfiles = {
      CUSTOMER: { email: 'customer@banking-system.app', route: '/dashboard/home' },
      EMPLOYEE: { email: 'employee@banking-system.app', route: '/employee-dashboard/employee-home' },
      MANAGER: { email: 'manager@banking-system.app', route: '/manager-dashboard/manager-home' }
    };
    const profile = demoProfiles[type];
    this.seedDemoSession(type, profile.email);
    this.router.navigate([profile.route]);
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
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: this.errorMessage
      });
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
    Swal.fire({
      icon: 'error',
      title: 'Authentication Failed',
      text: message
    });
  }

  private openCustomerDashboard(email: string): void {
    try {
      this.seedDemoSession('CUSTOMER', email);
      localStorage.setItem('demoMode', 'true');
    } catch (error) {
      console.error('Error storing authentication data:', error);
      this.isLoading = false;
      this.errorMessage = 'Failed to store authentication data';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: this.errorMessage
      });
      return;
    }

    this.isLoading = false;
    this.errorMessage = '';
    this.router.navigate(['/dashboard/home']);
  }

  private showValidationError(message: string): void {
    this.isLoading = false;
    this.errorMessage = message;
    Swal.fire({
      icon: 'error',
      title: 'Validation Error',
      text: message
    });
  }

  private showAuthenticationError(message: string): void {
    this.isLoading = false;
    this.errorMessage = message;
    Swal.fire({
      icon: 'error',
      title: 'Authentication Error',
      text: message
    });
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

  private seedDemoSession(type: 'CUSTOMER' | 'EMPLOYEE' | 'MANAGER', email: string): void {
    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('token', this.createDemoToken(type));
    localStorage.setItem('email', email);
    localStorage.setItem('userType', type);
  }

  private createDemoToken(type: string): string {
    const header = this.base64UrlEncode({ alg: 'HS256', typ: 'JWT' });
    const payload = this.base64UrlEncode({
      sub: `demo-${type.toLowerCase()}`,
      role: type,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24
    });

    return `${header}.${payload}.ZGVtby1zaWduYXR1cmU`;
  }

  private base64UrlEncode(value: object): string {
    return btoa(JSON.stringify(value))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}

