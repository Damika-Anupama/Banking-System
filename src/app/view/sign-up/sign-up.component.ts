import { Component } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { getPasswordStrength, PasswordStrength } from 'src/app/shared/password-strength';
import { seedDemoSession } from 'src/app/shared/demo-session';

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
  capsLockPassword = false;
  capsLockConfirm = false;

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

    // The name the user just typed follows them into the shell, so the
    // sidebar greets them rather than the seeded persona.
    seedDemoSession('CUSTOMER', this.email, this.fullName.trim());

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

  get passwordStrength(): PasswordStrength {
    return getPasswordStrength(this.password);
  }

}
