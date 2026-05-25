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

  authenticate(isValid: boolean | null): void {
    this.submitted = true;

    if (!isValid) {
      this.errorMessage = 'Please complete the sign-in form with valid details.';
      Swal.fire({
        icon: 'warning',
        title: 'Check your details',
        text: this.errorMessage,
        confirmButtonText: 'Review form'
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    setTimeout(() => {
      this.seedDemoSession('CUSTOMER', this.email || 'customer@banking-system.app');
      this.isLoading = false;
      this.router.navigate(['/dashboard/home']);
    }, 250);
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
