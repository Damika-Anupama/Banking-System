import { Component } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sign-up',
  standalone: false,
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  acceptedTerms = false;
  submitted = false;

  constructor(private router: Router) {}

  submitSignup(isValid: boolean | null): void {
    this.submitted = true;

    if (!isValid || this.passwordsDoNotMatch()) {
      Swal.fire({
        customClass: { popup: 'demo-detail-modal' },
        icon: 'warning',
        title: 'Check your details',
        text: 'Please complete the form with valid information before continuing.',
        confirmButtonText: 'Review form'
      });
      return;
    }

    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('token', this.createDemoToken());
    localStorage.setItem('email', this.email);
    localStorage.setItem('userType', 'CUSTOMER');

    Swal.fire({
      customClass: { popup: 'demo-detail-modal' },
      icon: 'success',
      title: 'Account ready',
      text: 'Your customer workspace is ready to view.',
      timer: 900,
      showConfirmButton: false
    }).then(() => this.router.navigate(['/dashboard/home']));
  }

  passwordsDoNotMatch(): boolean {
    return Boolean(this.password && this.confirmPassword && this.password !== this.confirmPassword);
  }

  private createDemoToken(): string {
    const header = this.base64UrlEncode({ alg: 'HS256', typ: 'JWT' });
    const payload = this.base64UrlEncode({
      sub: 'signup-customer',
      role: 'CUSTOMER',
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
}
