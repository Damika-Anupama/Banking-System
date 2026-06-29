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
  showPassword = false;
  showConfirmPassword = false;

  constructor(private router: Router) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

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

  get passwordStrength(): { label: string; width: number; barClass: string; textClass: string } {
    const p = this.password;
    if (!p) return { label: '', width: 0, barClass: '', textClass: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const levels = [
      { label: 'Very weak', width: 20, barClass: 'bg-red-400', textClass: 'text-red-400' },
      { label: 'Weak', width: 40, barClass: 'bg-orange-400', textClass: 'text-orange-400' },
      { label: 'Fair', width: 60, barClass: 'bg-amber-400', textClass: 'text-amber-400' },
      { label: 'Strong', width: 80, barClass: 'bg-emerald-400', textClass: 'text-emerald-400' },
      { label: 'Very strong', width: 100, barClass: 'bg-emerald-300', textClass: 'text-emerald-300' },
    ];
    return levels[Math.min(score - 1, 4)] || levels[0];
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
