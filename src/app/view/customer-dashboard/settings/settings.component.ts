import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from 'src/app/service/customer/user.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { ToastService } from 'src/app/service/toast.service';
import { getPasswordStrength, PasswordStrength } from 'src/app/shared/password-strength';
import { focusFirstError } from 'src/app/shared/focus-first-error';

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  // User data
  userId: string = '';
  username: string = '';
  fullname: string = '';
  email: string = '';
  password: string = '';
  address: string = '';
  contactNo: string = '';
  dob: string = '';
  gender: string = 'MALE';

  // Original data for reset
  originalData: any = {};

  // State management
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  showPassword = false;
  isEditingProfile = false;
  lastSavedAt = '';
  twoStepEnabled = localStorage.getItem('demo-2fa') !== 'false';
  loginAlertsEnabled = localStorage.getItem('demo-login-alerts') !== 'false';
  private subscriptions: Subscription[] = [];

  toggleTwoStep(): void {
    this.twoStepEnabled = !this.twoStepEnabled;
    localStorage.setItem('demo-2fa', String(this.twoStepEnabled));
    // Every other action in the app confirms itself; a silent security
    // toggle reads as "did that save?"
    this.toastService.success(
      this.twoStepEnabled ? 'Two-step verification on' : 'Two-step verification off',
      this.twoStepEnabled ? 'A code will be required at each sign-in.' : 'Sign-in no longer asks for a code.'
    );
  }

  toggleLoginAlerts(): void {
    this.loginAlertsEnabled = !this.loginAlertsEnabled;
    localStorage.setItem('demo-login-alerts', String(this.loginAlertsEnabled));
    this.toastService.success(
      this.loginAlertsEnabled ? 'Login alerts on' : 'Login alerts off',
      this.loginAlertsEnabled ? 'New device sign-ins will be flagged.' : 'New device sign-ins will not be flagged.'
    );
  }

  constructor(private userService: UserService, private toastService: ToastService) {}

  /** Fields the user has left, so errors appear on blur rather than while typing. */
  touched: Record<string, boolean> = {};

  private readonly validatedFields = ['username', 'email', 'fullname', 'password'];

  /**
   * Single source of truth for settings validity. Password is optional here:
   * an empty field means "keep my current password", so only a non-empty value
   * that is too short is an error.
   */
  get fieldErrors(): Record<string, string | null> {
    return {
      username: !this.username || this.username.trim().length < 3
        ? 'Username must be at least 3 characters.'
        : null,

      email: !this.email || !this.email.includes('@')
        ? 'Enter a valid email address.'
        : null,

      fullname: !this.fullname || this.fullname.trim().length < 2
        ? 'Enter your full name.'
        : null,

      password: this.password && this.password.trim().length > 0 && this.password.length < 6
        ? 'Use at least 6 characters, or leave empty to keep your current password.'
        : null,
    };
  }

  get hasFieldErrors(): boolean {
    return this.validatedFields.some((field) => this.fieldErrors[field]);
  }

  get firstFieldError(): string | null {
    for (const field of this.validatedFields) {
      const error = this.fieldErrors[field];
      if (error) return error;
    }
    return null;
  }

  /** The first field the form rejected, so focus can be sent straight to it. */
  get firstErrorField(): string | null {
    for (const field of this.validatedFields) {
      if (this.fieldErrors[field]) return field;
    }
    return null;
  }

  errorFor(field: string): string | null {
    return this.touched[field] ? this.fieldErrors[field] : null;
  }

  markTouched(field: string): void {
    this.touched[field] = true;
  }

  markAllTouched(): void {
    this.validatedFields.forEach((field) => (this.touched[field] = true));
  }


  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || (localStorage.getItem('demoMode') === 'true' ? 'CUS-1001' : '');
    this.email = localStorage.getItem('email') || '';

    if (!this.userId) {
      this.toastService.error('Session expired', 'User session not found. Please log in again.');
      return;
    }

    this.loadUserData();
  }

  /**
   * Load user data from backend
   */
  loadUserData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const sub = this.userService.getById(this.userId).subscribe({
      next: (data) => {
        if (!data || !data.data || data.data.length === 0) {
          this.errorMessage = 'User data not found';
          this.isLoading = false;
          this.toastService.error('Could not load settings', 'Could not load user data.');
          return;
        }

        const userData = data.data[0];
        this.username = userData.username || '';
        this.fullname = userData.fullname || '';
        this.email = userData.email || '';
        this.address = userData.address || '';
        this.contactNo = userData.contact_no || '';
        this.gender = userData.gender || 'MALE';

        // Format date for input field
        if (userData.dob) {
          const date = new Date(userData.dob);
          this.dob = date.toISOString().split('T')[0];
        }

        // Store original data for reset
        this.originalData = {
          username: this.username,
          fullname: this.fullname,
          email: this.email,
          address: this.address,
          contactNo: this.contactNo,
          dob: this.dob,
          gender: this.gender
        };

        this.isLoading = false;
        this.lastSavedAt = new Date().toLocaleString();
      },
      error: (err) => {
        console.error('Error loading user data:', err);
        this.errorMessage = err.message || 'Failed to load user data';
        this.isLoading = false;
        this.toastService.error('Could not load settings', this.errorMessage);
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /** Strength scoring for the new-password field (shared with the sign-up meter). */
  get passwordStrength(): PasswordStrength {
    return getPasswordStrength(this.password);
  }

  get maskedEmail(): string {
    const [name, domain] = (this.email || '').split('@');
    if (!name || !domain) return this.email || 'Not provided';
    return `${name.slice(0, 2)}•••@${domain}`;
  }

  get maskedContactNo(): string {
    return this.contactNo ? `${this.contactNo.slice(0, 3)}••••${this.contactNo.slice(-2)}` : 'Not provided';
  }

  enableProfileEdit(): void {
    this.isEditingProfile = true;
  }

  cancelProfileEdit(): void {
    this.resetForm();
    this.isEditingProfile = false;
  }

  /**
   * Save user settings
   */
  saveSettings(): void {
    // Surface every problem at once, against the field that caused it.
    this.markAllTouched();

    if (this.hasFieldErrors) {
      this.toastService.error('Check the highlighted fields', this.firstFieldError ?? undefined);
      focusFirstError(this.firstErrorField);
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const userData = {
      username: this.username.trim(),
      fullname: this.fullname.trim(),
      email: this.email.trim(),
      address: this.address.trim(),
      contact_no: this.contactNo.trim(),
      dob: this.dob,
      gender: this.gender,
      password: this.password.trim() // Empty string if not changing password
    };

    const sub = this.userService.updateUser(this.userId, userData).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.isEditingProfile = false;
        this.lastSavedAt = new Date().toLocaleString();

        this.toastService.success('Settings saved', 'Settings updated successfully.');

        // Update original data
        this.originalData = {
          username: this.username,
          fullname: this.fullname,
          email: this.email,
          address: this.address,
          contactNo: this.contactNo,
          dob: this.dob,
          gender: this.gender
        };

        // Clear password field
        this.password = '';

        // Update email in localStorage if changed
        if (this.email !== localStorage.getItem('email')) {
          localStorage.setItem('email', this.email);
        }
      },
      error: (err) => {
        console.error('Error updating settings:', err);
        this.errorMessage = err.message || 'Failed to update settings';
        this.isSaving = false;

        this.toastService.error('Could not save settings', this.errorMessage);
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Reset form to original data
   */
  resetForm(): void {
    this.username = this.originalData.username;
    this.fullname = this.originalData.fullname;
    this.email = this.originalData.email;
    this.address = this.originalData.address;
    this.contactNo = this.originalData.contactNo;
    this.dob = this.originalData.dob;
    this.gender = this.originalData.gender;
    this.password = '';
    this.showPassword = false;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
